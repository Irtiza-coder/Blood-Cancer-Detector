document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const disclaimerCheck = document.getElementById('disclaimerCheck');
    const initialOutput = document.getElementById('initialOutput');
    const resultOutput = document.getElementById('resultOutput');
    const previewImage = document.getElementById('previewImage');
    const fileNameDisplay = document.getElementById('fileName');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('border-primary', 'bg-light'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('border-primary', 'bg-light'));
    });

    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                fileNameDisplay.textContent = `Selected: ${file.name}`;

                // UPDATE: Change status text when image is selected
                const statusTitle = initialOutput.querySelector('h5');
                if (statusTitle) statusTitle.textContent = "Awaiting Analysis Result";

                checkEnableButton();

                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImage.src = e.target.result;
                    previewImage.classList.remove('d-none');
                }
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file.');
            }
        }
    }

    disclaimerCheck.addEventListener('change', checkEnableButton);

    function checkEnableButton() {
        if (fileInput.files.length > 0 && disclaimerCheck.checked) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }

    // Analyze Logic
    analyzeBtn.addEventListener('click', function () {
        // Show loading
        analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
        analyzeBtn.disabled = true;

        // Create FormData
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const csrfToken = getCookie('csrftoken');

        fetch('/predict/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = 'Analyze Now';
                    return;
                }

                // Hide initial, show result
                initialOutput.classList.add('d-none');
                resultOutput.classList.remove('d-none');

                // Update UI with Data
                // 1. Confidence
                const confidenceScore = document.querySelector('#resultOutput h2.text-primary');
                if (confidenceScore) confidenceScore.innerText = data.confidence;

                // 2. Result
                const resultText = document.querySelector('#resultOutput h2.text-danger');
                if (resultText) resultText.innerText = data.result;

                // 3. Image (Correctly show the uploaded one)
                const resultImage = document.querySelector('#resultOutput img.img-fluid');
                if (resultImage) {
                    const reader = new FileReader();
                    reader.onload = function (e) { resultImage.src = e.target.result; }
                    reader.readAsDataURL(fileInput.files[0]);
                }

                // 4. Update Badge/Status Text
                const statusBadge = document.querySelector('#resultOutput .badge');
                const statusTitle = document.querySelector('#resultOutput .card-header h5');

                if (data.result === 'Benign') {
                    statusBadge.className = 'badge bg-white text-success';
                    statusBadge.innerText = 'Negative';
                    statusTitle.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>AI Finding: Low Risk';
                    document.querySelector('.card-header').className = 'card-header bg-success text-white py-3';
                } else {
                    statusBadge.className = 'badge bg-white text-danger';
                    statusBadge.innerText = 'Positive';
                    statusTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>AI Finding: Elevated Risk';
                    document.querySelector('.card-header').className = 'card-header bg-danger text-white py-3';
                }

                // Reset button
                analyzeBtn.innerHTML = 'Analyze Now';
                analyzeBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during analysis.');
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = 'Analyze Now';
            });
    });

    // Helper to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});