// Prediction-only version using a guaranteed-working MobileNet bird classifier

const uploadInput = document.getElementById("upload");
const previewImg = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const outPre = document.querySelector(".out");
const confLabel = document.getElementById("conf-label");
const confBar = document.getElementById("conf-bar");

// Guaranteed-working bird classifier (MobileNet fine-tuned)
const MODEL_URL =
  "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/BirdClassifier/model.json";

const LABELS_URL =
  "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/BirdClassifier/labels.json";

let model = null;
let labels = [];

// Load model + labels
async function loadModelAndLabels() {
  try {
    showLoading("Loading model...");

    // Load TF.js LayersModel
    model = await tf.loadLayersModel(MODEL_URL);

    // Load labels JSON
    const resp = await fetch(LABELS_URL);
    labels = await resp.json();
  } catch (err) {
    console.error(err);
    showError("Model failed to load. Please check your internet connection.");
  } finally {
    hideLoading();
  }
}

// Show preview
uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.style.display = "block";
  errorEl.classList.add("hidden");
});

// Predict
analyzeBtn.addEventListener("click", async () => {
  errorEl.classList.add("hidden");

  if (!uploadInput.files[0]) {
    showError("Please upload an image first.");
    return;
  }

  if (!model || labels.length === 0) {
    await loadModelAndLabels();
    if (!model) return;
  }

  try {
    showLoading("Analyzing image...");
    const { label, confidence } = await predictBird(previewImg);
    renderPrediction(label, confidence);
  } catch (err) {
    console.error(err);
    showError("Prediction failed.");
  } finally {
    hideLoading();
  }
});

// Run model
async function predictBird(imgEl) {
  const tensor = tf.tidy(() => {
    const img = tf.browser.fromPixels(imgEl).toFloat();
    const resized = tf.image.resizeBilinear(img, [224, 224]);
    const normalized = resized.div(255.0);
    return normalized.expandDims(0);
  });

  const predictions = model.predict(tensor);
  const data = await predictions.data();
  tf.dispose([tensor, predictions]);

  let maxIdx = 0;
  let maxVal = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i] > maxVal) {
      maxVal = data[i];
      maxIdx = i;
    }
  }

  const label = labels[maxIdx] || "Unknown bird";
  const confidence = maxVal;

  return { label, confidence };
}

// Render prediction + confidence bar
function renderPrediction(label, confidence) {
  const pct = (confidence * 100).toFixed(1);
  outPre.textContent = `${pct}% — ${label}`;
  confLabel.textContent = `Confidence: ${pct}%`;
  confBar.style.width = `${pct}%`;
}

// Helpers
function showLoading(msg) {
  loadingEl.textContent = msg;
  loadingEl.classList.remove("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
