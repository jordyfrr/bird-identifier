const MODEL_URL = "./tm_model/"; // your exported folder

let model, maxPredictions;

// Load the model
async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    const row = document.createElement("div");
    row.className = "prediction-row";
    row.innerHTML = `
      <span class="pred-label"></span>
      <span class="pred-score"></span>
    `;
    labelContainer.appendChild(row);
  }
}

// Predict the uploaded image
async function predict() {
  const image = document.getElementById("preview");
  const predictions = await model.predict(image);

  const labelContainer = document.getElementById("label-container");
  const rows = labelContainer.children;

  predictions.sort((a, b) => b.probability - a.probability);

  predictions.forEach((p, i) => {
    rows[i].querySelector(".pred-label").textContent = p.className;
    rows[i].querySelector(".pred-score").textContent =
      (p.probability * 100).toFixed(1) + "%";
  });

  showBirdInfo(predictions[0].className);
}

// Bird info database
const birdInfo = {
  "Blue Jay": {
    scientific: "Cyanocitta cristata",
    fact: "Blue Jays are known for their intelligence and complex social systems."
  },
  "American Robin": {
    scientific: "Turdus migratorius",
    fact: "Robins are one of the earliest birds to sing at dawn."
  },
  "Northern Cardinal": {
    scientific: "Cardinalis cardinalis",
    fact: "Male cardinals are bright red due to carotenoid pigments in their diet."
  }
};

// Show bird info
function showBirdInfo(name) {
  const infoBox = document.getElementById("bird-info");
  const info = birdInfo[name];

  if (!info) {
    infoBox.innerHTML = `<p>No info available for ${name}.</p>`;
    return;
  }

  infoBox.innerHTML = `
    <p><strong>${name}</strong></p>
    <p><em>${info.scientific}</em></p>
    <p>${info.fact}</p>
  `;
}

// Handle image upload
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = document.getElementById("preview");
  img.src = URL.createObjectURL(file);
  img.onload = () => URL.revokeObjectURL(img.src);
});

document.getElementById("predictBtn").addEventListener("click", async () => {
  document.getElementById("status").textContent = "Loading model…";
  await init();
  document.getElementById("status").textContent = "Predicting…";
  await predict();
  document.getElementById("status").textContent = "Done.";
});

