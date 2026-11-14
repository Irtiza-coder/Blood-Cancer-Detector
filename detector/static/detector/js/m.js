// ELEMENTS
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const previewImage = document.getElementById("previewImage");
const disclaimerCheck = document.getElementById("disclaimerCheck");
const analyzeBtn = document.getElementById("analyzeBtn");

let currentFile = null;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.add("dragover"), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.remove("dragover"), false);
});

uploadArea.addEventListener("drop", e => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

uploadArea.addEventListener("click", e => {
    if (e.target !== fileInput) fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        return;
    }
    currentFile = file;
    fileName.innerText = "Selected: " + file.name;
    previewImage.src = URL.createObjectURL(file);
    previewImage.classList.remove("d-none");
    checkReady();
}

disclaimerCheck.addEventListener("change", checkReady);

function checkReady() {
    analyzeBtn.disabled = !(currentFile && disclaimerCheck.checked);
}
