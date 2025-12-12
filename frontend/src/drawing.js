// Global state
let drawingStates = [false, false, false];
let isDrawing = [false, false, false];

// Initialize canvases and buttons
function initCanvases() {
    for (let i = 0; i < 3; i++) {
        const canvas = document.getElementById(`canvas-${i}`);
        const ctx = canvas.getContext("2d");

        canvas.width = 300;
        canvas.height = 300;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        canvas.addEventListener('mousedown', (e) => startDraw(e, i));
        canvas.addEventListener('mousemove', (e) => draw(e, i));
        canvas.addEventListener('mouseup', () => stopDraw(i));
        canvas.addEventListener('mouseout', () => stopDraw(i));

        canvas.addEventListener('touchstart', (e) => {
            if (drawingStates[i]) {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (drawingStates[i] && isDrawing[i]) {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (drawingStates[i]) {
                e.preventDefault();
                const mouseEvent = new MouseEvent('mouseup', {});
                canvas.dispatchEvent(mouseEvent);
            }
        }, { passive: false });

        // Buttons
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

// -------------------- DRAWING --------------------
function startDrawing(slotIndex) {
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const overlay = document.getElementById(`overlay-${slotIndex}`);
    const container = canvas.parentElement;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    overlay.style.display = 'none';
    container.classList.add('has-image', 'drawing-mode');

    const clearBtn = container.closest('.image-slot').querySelector('.btn-clear');
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
        setTimeout(() => generateLabel(slotIndex), 300);
    }
}

// -------------------- UPLOAD --------------------
function triggerUpload(slotIndex) {
    const uploadInput = document.getElementById('upload-' + slotIndex);
    if (!uploadInput) return;
    uploadInput.value = '';
    uploadInput.click();
}

function handleUpload(slotIndex, file) {
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

            const clearBtn = container.closest('.image-slot').querySelector('.btn-clear');
            if (clearBtn) clearBtn.style.display = 'inline-block';

            drawingStates[slotIndex] = true;
            generateLabel(slotIndex);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// -------------------- CLEAR --------------------
function clearSlot(slotIndex) {
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const ctx = canvas.getContext("2d");
    const overlay = document.getElementById(`overlay-${slotIndex}`);
    const container = canvas.parentElement;
    const labelContainer = document.getElementById(`label-${slotIndex}`);
    const clearBtn = container.closest('.image-slot').querySelector('.btn-clear');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    overlay.style.display = 'flex';
    container.classList.remove('has-image', 'drawing-mode');
    labelContainer.style.display = 'none';
    canvas.style.border = 'none';

    if (clearBtn) clearBtn.style.display = 'none';
    drawingStates[slotIndex] = false;
    isDrawing[slotIndex] = false;
    
    // Clear review input for this slot
    const reviewInput = document.getElementById(`review-label-${slotIndex}`);
    if (reviewInput) {
        reviewInput.value = "";
    }
    
    checkAndShowReviewSection();
}

// -------------------- CANVAS CROPPING --------------------
function cropCanvasToDrawing(sourceCanvas) {
    const ctx = sourceCanvas.getContext("2d");
    const { width, height } = sourceCanvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r < 250 || g < 250 || b < 250) {
                found = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!found) return null;

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const cropped = document.createElement("canvas");
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    cropped.getContext("2d").drawImage(
        sourceCanvas,
        minX, minY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    return cropped;
}

// -------------------- GENERATE LABEL (BeIT) --------------------
async function generateLabel(slotIndex) {
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const labelContainer = document.getElementById(`label-${slotIndex}`);
    const labelText = document.getElementById(`label-text-${slotIndex}`);
    const loading = document.getElementById(`loading-${slotIndex}`);

    labelContainer.style.display = "block";
    loading.style.display = "block";
    labelText.textContent = "-";

    try {
        // Crop & convert canvas to Base64
        const cropped = cropCanvasToDrawing(canvas);
        if (!cropped) {
            labelText.textContent = "nothing drawn";
            loading.style.display = "none";
            return;
        }

        const dataUrl = cropped.toDataURL("image/png");

        // Retry logic with delay for first-time model loading
        let lastError = null;
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Use relative URL to work with unified backend
                const response = await fetch("/api/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ image: dataUrl })
                });

                if (!response.ok) {
                    // If 503 (service unavailable), retry after delay
                    if (response.status === 503 && attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                    throw new Error(`Server error: ${response.status}`);
                }

                const result = await response.json();
                
                // Check if there's an error in the response
                if (result.error) {
                    // If model is loading, retry after delay
                    if (result.error.includes("not available") || result.error.includes("not loaded") || result.error.includes("Model")) {
                        if (attempt < maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                    console.error("BEiT API error:", result.error);
                    labelText.textContent = "Error";
                    updateReviewSection(slotIndex, "Error");
                    loading.style.display = "none";
                    return;
                }
                
                // Success!
                const label = result.label || "unknown";
                labelText.textContent = label;
                updateReviewSection(slotIndex, label);
                loading.style.display = "none";
                return;
                
            } catch (err) {
                lastError = err;
                // If it's a network error or 503, retry after delay
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
            }
        }
        
        // All retries failed
        throw lastError || new Error("Failed after multiple attempts");
        
    } catch (err) {
        console.error("Error calling BEiT server:", err);
        labelText.textContent = "Error";
        updateReviewSection(slotIndex, "Error");
    } finally {
        loading.style.display = "none";
    }
}

// Update the review section with a generated label
function updateReviewSection(slotIndex, label) {
    const reviewInput = document.getElementById(`review-label-${slotIndex}`);
    if (reviewInput) {
        reviewInput.value = label;
        // Show review section when at least one label is generated
        checkAndShowReviewSection();
    }
}

// Check if any labels are generated and show review section
function checkAndShowReviewSection() {
    const reviewSection = document.getElementById('review-section');
    let hasAnyLabel = false;
    
    for (let i = 0; i < 3; i++) {
        const labelText = document.getElementById(`label-text-${i}`);
        const reviewInput = document.getElementById(`review-label-${i}`);
        if (labelText && labelText.textContent !== "-" && labelText.textContent !== "" && 
            !labelText.textContent.includes("Click") && !labelText.textContent.includes("Processing") &&
            labelText.textContent !== "nothing drawn" && labelText.textContent !== "error") {
            hasAnyLabel = true;
            // Sync review input with label
            if (reviewInput && !reviewInput.value) {
                reviewInput.value = labelText.textContent;
            }
        }
    }
    
    if (hasAnyLabel && reviewSection) {
        reviewSection.style.display = "block";
    }
}

// Confirm the labels and navigate to next page
function confirmLabels() {
    const labels = [];
    
    for (let i = 0; i < 3; i++) {
        const reviewInput = document.getElementById(`review-label-${i}`);
        const label = reviewInput ? reviewInput.value.trim() : "";
        if (label) {
            labels.push(label);
        }
    }
    
    if (labels.length === 0) {
        alert("Please add at least one label before proceeding.");
        return;
    }
    
    // Store only labels in localStorage (mood will be selected on page 2)
    localStorage.setItem('doodletunes_labels', JSON.stringify(labels));
    
    // Navigate to lyrics generation page
    window.location.href = "index.html";
}

// -------------------- INIT --------------------
window.addEventListener('DOMContentLoaded', () => {
    initCanvases();
    
    // Set up confirm button
    const confirmBtn = document.getElementById('btn-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmLabels);
    }
});

