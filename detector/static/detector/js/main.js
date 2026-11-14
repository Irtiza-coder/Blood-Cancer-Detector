document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const disclaimerCheck = document.getElementById('disclaimerCheck');
    const initialOutput = document.getElementById('initialOutput');
    const resultOutput = document.getElementById('resultOutput');
    const previewImage = document.getElementById('previewImage');
    const fileNameDisplay = document.getElementById('fileName');

    let currentFile = null;

    // Prevent default drag behaviors on window & drop area
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    // Clicking upload area opens file browser
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // Handle file selected from file picker
    fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    });

    function handleDrop(e) {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            processFile(dt.files[0]);
            try {
                fileInput.files = dt.files;
            } catch (err) {
                // Ignore if browser prevents direct assignment
            }
        }
    }

    function processFile(file) {
        if (!file) return;

        if (file.type.startsWith('image/')) {
            currentFile = file;
            fileNameDisplay.textContent = `Selected: ${file.name}`;

            const statusTitle = initialOutput.querySelector('h5');
            if (statusTitle) statusTitle.textContent = "Awaiting Analysis Result";

            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('d-none');
            };
            reader.readAsDataURL(file);

            checkEnableButton();
        } else {
            alert('Please upload a valid image file (JPG or PNG).');
        }
    }

    disclaimerCheck.addEventListener('change', checkEnableButton);

    function checkEnableButton() {
        if (currentFile && disclaimerCheck.checked) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }

    // Analyze Logic
    analyzeBtn.addEventListener('click', function () {
        if (!currentFile) {
            alert('Please select or drop an image first.');
            return;
        }

        // Show loading spinner
        analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
        analyzeBtn.disabled = true;

        // Create FormData
        const formData = new FormData();
        formData.append('image', currentFile);
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
                const confidenceScore = document.querySelector('#resultOutput h2.text-primary');
                if (confidenceScore) confidenceScore.innerText = data.confidence;

                const resultText = document.querySelector('#resultOutput h2.text-danger');
                if (resultText) resultText.innerText = data.result;

                const resultImage = document.querySelector('#resultOutput img.img-fluid');
                if (resultImage && previewImage.src) {
                    resultImage.src = previewImage.src;
                }

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
