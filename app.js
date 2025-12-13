// Global state
let model = null;
let drawingStates = [false, false, false];
let isDrawing = [false, false, false];

// Initialize DoodleNet from ml5.js
function loadModel() {
    const statusEl = document.getElementById('model-status');
    if (!statusEl) {
        console.error('model-status element not found!');
        return;
    }
    statusEl.textContent = 'Loading DoodleNet model...';

    if (typeof ml5 === 'undefined') {
        console.error('ml5.js is not loaded! Make sure the script tag is in your HTML.');
        statusEl.textContent = 'Error: ml5.js not loaded';
        model = null;
        return;
    }

    ml5.imageClassifier('DoodleNet')
        .then((classifier) => {
            model = classifier;
            model.ready = true;
            statusEl.textContent = 'DoodleNet model ready!';
            statusEl.classList.add('loaded');
        })
        .catch((error) => {
            console.error('Error loading DoodleNet:', error);
            statusEl.textContent = 'Failed to load DoodleNet.';
            model = null;
        });
}

function classifyCanvas(canvas, callback) {
    if (!model || !model.ready) {
        callback("Model not ready", null);
        return;
    }

    if (typeof model.classify !== "function") {
        callback("Model does not have classify method", null);
        return;
    }

    // Check if canvas has content
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasContent = false;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
            hasContent = true;
            break;
        }
    }

    if (!hasContent) {
        callback("Canvas is empty", null);
        return;
    }

    // Preprocess canvas to 28x28 grayscale for DoodleNet
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    // Convert to grayscale
    const tempImageData = tempCtx.getImageData(0, 0, 28, 28);
    const tempData = tempImageData.data;
    for (let i = 0; i < tempData.length; i += 4) {
        const gray = 0.299 * tempData[i] + 0.587 * tempData[i + 1] + 0.114 * tempData[i + 2];
        tempData[i] = gray;
        tempData[i + 1] = gray;
        tempData[i + 2] = gray;
    }
    tempCtx.putImageData(tempImageData, 0, 0);

    // Classify the processed canvas
    try {
        model.classify(tempCanvas, (arg1, arg2) => {
            let error = null;
            let results = null;

            // Handle different callback signatures
            if (arg1 instanceof Error || (typeof arg1 === 'string' && arg1 && !Array.isArray(arg1))) {
                error = arg1;
                results = arg2;
            } else if (Array.isArray(arg1)) {
                error = null;
                results = arg1;
            } else if (arg2 && Array.isArray(arg2)) {
                error = arg1;
                results = arg2;
            } else {
                results = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : null);
                error = results ? null : "Unknown response format";
            }

            callback(error, results);
        });
    } catch (error) {
        callback(error, null);
    }
}

// Initialize canvases and buttons
function initCanvases() {
    for (let i = 0; i < 3; i++) {
        const canvas = document.getElementById(`canvas-${i}`);
        const ctx = canvas.getContext("2d");

        canvas.width = 300;
        canvas.height = 300;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Drawing event listeners
        canvas.addEventListener('mousedown', (e) => startDraw(e, i));
        canvas.addEventListener('mousemove', (e) => draw(e, i));
        canvas.addEventListener('mouseup', () => stopDraw(i));
        canvas.addEventListener('mouseout', () => stopDraw(i));

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            if (drawingStates[i]) {
                e.preventDefault();
                const touch = e.touches[0];
                canvas.dispatchEvent(new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                }));
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (drawingStates[i] && isDrawing[i]) {
                e.preventDefault();
                const touch = e.touches[0];
                canvas.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                }));
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (drawingStates[i]) {
                e.preventDefault();
                canvas.dispatchEvent(new MouseEvent('mouseup', {}));
            }
        }, { passive: false });

        // Button event listeners
        const drawBtn = document.querySelector(`.btn-draw[data-slot="${i}"]`);
        const uploadBtn = document.querySelector(`.btn-upload[data-slot="${i}"]`);
        const clearBtn = document.querySelector(`.btn-clear[data-slot="${i}"]`);
        const uploadInput = document.getElementById(`upload-${i}`);

        if (drawBtn) drawBtn.addEventListener('click', () => startDrawing(i));
        if (uploadBtn) uploadBtn.addEventListener('click', () => triggerUpload(i));
        if (clearBtn) clearBtn.addEventListener('click', () => clearSlot(i));
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleUpload(i, file);
            });
        }
    }
}

// Drawing functions
function startDrawing(slotIndex) {
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const overlay = document.getElementById(`overlay-${slotIndex}`);
    const container = canvas.parentElement;

    if (!canvas || !overlay || !container) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    overlay.style.display = 'none';
    container.classList.add('has-image', 'drawing-mode');

    const imageSlot = container.closest('.image-slot');
    const clearBtn = imageSlot.querySelector('.btn-clear');
    if (clearBtn) clearBtn.style.display = 'inline-block';

    drawingStates[slotIndex] = true;
    canvas.style.border = '2px solid #667eea';
}

function startDraw(e, slotIndex) {
    if (!drawingStates[slotIndex]) return;

    isDrawing[slotIndex] = true;
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e, slotIndex) {
    if (!isDrawing[slotIndex] || !drawingStates[slotIndex]) return;

    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDraw(slotIndex) {
    if (isDrawing[slotIndex] && drawingStates[slotIndex]) {
        isDrawing[slotIndex] = false;
        setTimeout(() => generateLabel(slotIndex), 500);
    }
}

// Upload functions
function triggerUpload(slotIndex) {
    const uploadInput = document.getElementById('upload-' + slotIndex);
    if (!uploadInput) return;
    uploadInput.value = '';
    uploadInput.click();
}

function handleUpload(slotIndex, file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById(`canvas-${slotIndex}`);
            const ctx = canvas.getContext("2d");
            const overlay = document.getElementById(`overlay-${slotIndex}`);
            const container = canvas.parentElement;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            overlay.style.display = 'none';
            container.classList.add('has-image');
            container.classList.remove('drawing-mode');

            const imageSlot = container.closest('.image-slot');
            const clearBtn = imageSlot.querySelector('.btn-clear');
            if (clearBtn) clearBtn.style.display = 'inline-block';

            drawingStates[slotIndex] = true;
            generateLabel(slotIndex);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Clear slot
function clearSlot(slotIndex) {
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const ctx = canvas.getContext("2d");
    const overlay = document.getElementById(`overlay-${slotIndex}`);
    const container = canvas.parentElement;
    const labelContainer = document.getElementById(`label-${slotIndex}`);
    const imageSlot = container.closest('.image-slot');
    const clearBtn = imageSlot.querySelector('.btn-clear');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    overlay.style.display = 'flex';
    container.classList.remove('has-image', 'drawing-mode');
    labelContainer.style.display = 'none';
    canvas.style.border = 'none';
    if (clearBtn) clearBtn.style.display = 'none';

    drawingStates[slotIndex] = false;
    isDrawing[slotIndex] = false;
}

// Generate label using DoodleNet from ml5.js
function generateLabel(slotIndex) {
    if (!model || model.ready === false) {
        const labelContainer = document.getElementById(`label-${slotIndex}`);
        const labelText = document.getElementById(`label-text-${slotIndex}`);
        if (labelContainer && labelText) {
            labelContainer.style.display = 'block';
            labelText.textContent = 'Model loading...';
        }
        return;
    }

    if (typeof model.classify !== "function") {
        console.error('Model does not have classify method');
        return;
    }

    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const labelContainer = document.getElementById(`label-${slotIndex}`);
    const labelText = document.getElementById(`label-text-${slotIndex}`);
    const loading = document.getElementById(`loading-${slotIndex}`);

    if (!canvas || !labelContainer || !labelText) return;

    labelContainer.style.display = 'block';
    if (loading) loading.style.display = 'block';
    labelText.textContent = 'Processing...';

    classifyCanvas(canvas, (err, results) => {
        if (loading) loading.style.display = 'none';

        if (err) {
            console.error('Classification error:', err);
            labelText.textContent = 'Error';
            return;
        }

        if (!results || results.length === 0) {
            labelText.textContent = 'Unknown';
            return;
        }

        labelText.textContent = results[0].label;
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initCanvases();
    loadModel();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    initCanvases();
    loadModel();
}
