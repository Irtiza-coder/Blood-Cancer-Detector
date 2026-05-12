// ELEMENTS
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const previewImage = document.getElementById("previewImage");

const disclaimerCheck = document.getElementById("disclaimerCheck");
const analyzeBtn = document.getElementById("analyzeBtn");

const loadingBox = document.getElementById("loadingBox");

const initialOutput = document.getElementById("initialOutput");
const resultOutput = document.getElementById("resultOutput");

const confidenceBar = document.getElementById("confidenceBar");
const stageText = document.getElementById("stageText");
const resultTitle = document.getElementById("resultTitle");
const resultBadge = document.getElementById("resultBadge");

const downloadBtn = document.getElementById("downloadBtn");

// ===============================
// UPLOAD & PREVIEW
// ===============================
uploadArea.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    fileName.innerText = file.name;
    previewImage.src = URL.createObjectURL(file);
    previewImage.classList.remove("d-none");

    checkReady();
});

// ===============================
// ENABLE ANALYZE BUTTON
// ===============================
disclaimerCheck.addEventListener("change", checkReady);

function checkReady() {
    analyzeBtn.disabled = !(fileInput.files.length && disclaimerCheck.checked);
}

// ===============================
// ANALYZE IMAGE
// ===============================
analyzeBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    // UI states
    analyzeBtn.disabled = true;
    loadingBox.classList.remove("d-none");

    fetch("/predict/", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showResult(data.result, data.confidence);
        })
        .catch(error => {
            console.error(error);
            alert("Prediction failed. Please try again.");
        })
        .finally(() => {
            analyzeBtn.disabled = false;
            loadingBox.classList.add("d-none");
        });
});

// ===============================
// SHOW RESULT
// ===============================
function showResult(result, confidence) {
    initialOutput.classList.add("d-none");
    resultOutput.classList.remove("d-none");

    // Confidence bar
    confidenceBar.style.width = confidence;
    confidenceBar.innerText = confidence;

    // Stage text
    stageText.innerText = result;

    const header = resultOutput.querySelector(".card-header");

    // BENIGN (NEGATIVE)
    if (result === "Benign") {
        header.classList.remove("bg-danger");
        header.classList.add("bg-success");

        stageText.classList.remove("text-danger");
        stageText.classList.add("text-success");

        resultBadge.innerText = "Negative";
        resultBadge.classList.remove("text-danger");
        resultBadge.classList.add("text-success");

        resultTitle.innerHTML =
            `<i class="fa-solid fa-circle-check me-2"></i>AI Finding: No Cancer Detected`;
    }
    // CANCER (POSITIVE)
    else {
        header.classList.remove("bg-success");
        header.classList.add("bg-danger");

        stageText.classList.remove("text-success");
        stageText.classList.add("text-danger");

        resultBadge.innerText = "Positive";
        resultBadge.classList.remove("text-success");
        resultBadge.classList.add("text-danger");

        resultTitle.innerHTML =
            `<i class="fa-solid fa-triangle-exclamation me-2"></i>AI Finding: Cancer Detected`;
    }
}

// ===============================
// DOWNLOAD PDF REPORT
// ===============================
downloadBtn.addEventListener("click", () => {
    const result = stageText.innerText;
    const confidence = confidenceBar.innerText;

    window.location.href =
        `/download-report/?result=${encodeURIComponent(result)}&confidence=${encodeURIComponent(confidence)}`;
});