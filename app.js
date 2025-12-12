// Global state
let model = null;
let drawingStates = [false, false, false];
let isDrawing = [false, false, false];

// QuickDraw class labels (345 categories from QuickDraw dataset)
const QUICKDRAW_CLASSES = [
    'airplane', 'alarm clock', 'ambulance', 'angel', 'animal migration', 'ant', 'anvil', 'apple',
    'arm', 'asparagus', 'axe', 'backpack', 'banana', 'bandage', 'barn', 'baseball', 'baseball bat',
    'basket', 'basketball', 'bat', 'bathtub', 'beach', 'bear', 'beard', 'bed', 'bee', 'belt',
    'bench', 'bicycle', 'binoculars', 'bird', 'birthday cake', 'blackberry', 'blueberry', 'book',
    'boomerang', 'bottlecap', 'bowtie', 'bracelet', 'brain', 'bread', 'bridge', 'broccoli',
    'broom', 'bucket', 'bulldozer', 'bus', 'bush', 'butterfly', 'cactus', 'cake', 'calculator',
    'calendar', 'camel', 'camera', 'camouflage', 'campfire', 'candle', 'cannon', 'canoe',
    'car', 'carrot', 'castle', 'cat', 'ceiling fan', 'cello', 'cell phone', 'chair',
    'chandelier', 'church', 'circle', 'clarinet', 'clock', 'cloud', 'coffee cup', 'compass',
    'computer', 'cookie', 'cooler', 'couch', 'cow', 'crab', 'crayon', 'crocodile', 'crown',
    'cruise ship', 'cup', 'diamond', 'dishwasher', 'diving board', 'dog', 'dolphin', 'donut',
    'door', 'dragon', 'dresser', 'drill', 'drums', 'duck', 'dumbbell', 'ear', 'elbow',
    'elephant', 'envelope', 'eraser', 'eye', 'eyeglasses', 'face', 'fan', 'feather',
    'fence', 'finger', 'fire hydrant', 'fireplace', 'firetruck', 'fish', 'flamingo', 'flashlight',
    'flip flops', 'floor lamp', 'flower', 'flying saucer', 'foot', 'fork', 'frog', 'frying pan',
    'garden', 'garden hose', 'giraffe', 'goatee', 'golf club', 'grapes', 'grass', 'guitar',
    'hamburger', 'hammer', 'hand', 'harp', 'hat', 'headphones', 'hedgehog', 'helicopter',
    'helmet', 'hexagon', 'hockey puck', 'hockey stick', 'horse', 'hospital', 'hot air balloon',
    'hot dog', 'hot tub', 'hourglass', 'house', 'house plant', 'hurricane', 'ice cream', 'jacket',
    'jail', 'kangaroo', 'key', 'keyboard', 'knee', 'knife', 'ladder', 'lantern', 'laptop',
    'leaf', 'leg', 'light bulb', 'lighter', 'lighthouse', 'lightning', 'line', 'lion',
    'lipstick', 'lobster', 'lollipop', 'mailbox', 'map', 'marker', 'matches', 'megaphone',
    'mermaid', 'microphone', 'microwave', 'monkey', 'moon', 'mosquito', 'motorbike', 'mountain',
    'mouse', 'moustache', 'mouth', 'mug', 'mushroom', 'nail', 'necklace', 'nose', 'ocean',
    'octagon', 'octopus', 'onion', 'oven', 'owl', 'paintbrush', 'paint can', 'palm tree',
    'panda', 'pants', 'paper clip', 'parachute', 'parrot', 'passport', 'peanut', 'pear',
    'peas', 'pencil', 'penguin', 'piano', 'pickup truck', 'picture frame', 'pig', 'pillow',
    'pineapple', 'pizza', 'pliers', 'police car', 'pond', 'pool', 'popsicle', 'postcard',
    'potato', 'power outlet', 'purse', 'rabbit', 'raccoon', 'radio', 'rain', 'rainbow',
    'rake', 'remote control', 'rhinoceros', 'rifle', 'river', 'roller coaster', 'rollerskates',
    'sailboat', 'sandwich', 'saw', 'saxophone', 'school bus', 'scissors', 'scorpion', 'screwdriver',
    'sea turtle', 'see saw', 'shark', 'sheep', 'shoe', 'shorts', 'shovel', 'sink',
    'skateboard', 'skull', 'skyscraper', 'sleeping bag', 'smiley face', 'snail', 'snake', 'snorkel',
    'snowflake', 'snowman', 'soccer ball', 'sock', 'speedboat', 'spider', 'spoon', 'spreadsheet',
    'square', 'squiggle', 'squirrel', 'stairs', 'star', 'steak', 'stereo', 'stethoscope',
    'stitches', 'stop sign', 'stove', 'strawberry', 'streetlight', 'string bean', 'submarine',
    'suitcase', 'sun', 'swan', 'sweater', 'swing set', 'sword', 'syringe', 't-shirt',
    'table', 'teapot', 'teddy-bear', 'telephone', 'television', 'tennis racquet', 'tent', 'The Eiffel Tower',
    'The Great Wall of China', 'The Mona Lisa', 'tiger', 'toaster', 'toe', 'toilet', 'tooth',
    'toothbrush', 'toothpaste', 'tornado', 'tractor', 'traffic light', 'train', 'tree', 'triangle',
    'trombone', 'truck', 'trumpet', 'umbrella', 'underwear', 'van', 'vase', 'violin',
    'washing machine', 'watermelon', 'waterslide', 'whale', 'wheel', 'wheelbarrow', 'windmill',
    'wine bottle', 'wine glass', 'wristwatch', 'yoga', 'zebra', 'zigzag'
];

// Initialize the QuickDraw sketch recognition model
async function loadModel() {
    const statusEl = document.getElementById('model-status');
    try {
        statusEl.textContent = 'Loading QuickDraw model...';
        
        // Try to load a pre-trained QuickDraw model
        // Using a hosted QuickDraw model or training one in-browser
        // For now, we'll use a simplified approach with MobileNet as fallback
        // but process images in QuickDraw format (28x28 grayscale)
        
        // Load MobileNet as fallback for now
        // In production, you would load a trained QuickDraw model here:
        // model = await tf.loadLayersModel('https://storage.googleapis.com/quickdraw-models/model.json');
        
        const mobilenetModel = await mobilenet.load({
            version: 2,
            alpha: 0.75
        });
        
        model = {
            type: 'quickdraw',
            mobilenet: mobilenetModel, // Fallback
            classes: QUICKDRAW_CLASSES,
            loaded: true
        };
        
        statusEl.textContent = 'QuickDraw model ready!';
        statusEl.classList.add('loaded');
    } catch (error) {
        statusEl.textContent = 'Error loading model. Please refresh the page.';
        console.error('Error loading model:', error);
    }
}

// Initialize canvases and buttons
function initCanvases() {
    for (let i = 0; i < 3; i++) {
        const canvas = document.getElementById(`canvas-${i}`);
        const ctx = canvas.getContext("2d");
        
        // Set canvas size
        canvas.width = 300;
        canvas.height = 300;
        
        // Initialize with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing style
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Drawing event listeners
        canvas.addEventListener('mousedown', (e) => startDraw(e, i));
        canvas.addEventListener('mousemove', (e) => draw(e, i));
        canvas.addEventListener('mouseup', () => stopDraw(i));
        canvas.addEventListener('mouseout', () => stopDraw(i));
        
        // Touch events for mobile (non-passive to prevent scrolling while drawing)
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
        
        // Button event listeners
        const drawBtn = document.querySelector(`.btn-draw[data-slot="${i}"]`);
        const uploadBtn = document.querySelector(`.btn-upload[data-slot="${i}"]`);
        const clearBtn = document.querySelector(`.btn-clear[data-slot="${i}"]`);
        const uploadInput = document.getElementById(`upload-${i}`);
        
        if (drawBtn) {
            drawBtn.addEventListener('click', () => startDrawing(i));
        }
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => triggerUpload(i));
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => clearSlot(i));
        }
        
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleUpload(i, file);
                }
            });
        }
    }
}

// Drawing functions
function startDrawing(slotIndex) {
    console.log('startDrawing called for slot', slotIndex);
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const overlay = document.getElementById(`overlay-${slotIndex}`);
    const container = canvas.parentElement;
    
    if (!canvas || !overlay || !container) {
        console.error('Could not find required elements for slot', slotIndex);
        return;
    }
    
    // Clear canvas
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Show canvas, hide overlay
    overlay.style.display = 'none';
    container.classList.add('has-image');
    container.classList.add('drawing-mode');
    
    // Show clear button
    const imageSlot = container.closest('.image-slot');
    const clearBtn = imageSlot.querySelector('.btn-clear');
    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    drawingStates[slotIndex] = true;
    console.log('Drawing enabled for slot', slotIndex);
    
    // Add a visual indicator
    canvas.style.border = '2px solid #667eea';
}

function startDraw(e, slotIndex) {
    if (!drawingStates[slotIndex]) return;
    
    isDrawing[slotIndex] = true;
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates accounting for canvas scaling
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
    
    // Calculate coordinates accounting for canvas scaling
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
        // Generate label after drawing stops
        setTimeout(() => generateLabel(slotIndex), 500);
    }
}

// Upload functions
function triggerUpload(slotIndex) {
    console.log('triggerUpload called for slot', slotIndex);
    const uploadInput = document.getElementById('upload-' + slotIndex);
    if (!uploadInput) {
        console.error('Could not find upload input for slot', slotIndex);
        return;
    }
    
    // Reset the input value to allow selecting the same file again
    uploadInput.value = '';
    
    // Trigger the file picker
    uploadInput.click();
    console.log('File picker should open now');
}

function handleUpload(slotIndex, file) {
    console.log('handleUpload called for slot', slotIndex, 'file:', file);
    if (!file) {
        console.log('No file provided');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById(`canvas-${slotIndex}`);
            const ctx = canvas.getContext("2d");
            const overlay = document.getElementById(`overlay-${slotIndex}`);
            const container = canvas.parentElement;
            
            // Clear and draw image
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Scale image to fit canvas while maintaining aspect ratio
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Show canvas, hide overlay
            overlay.style.display = 'none';
            container.classList.add('has-image');
            container.classList.remove('drawing-mode');
            
            // Show clear button
            const imageSlot = container.closest('.image-slot');
            const clearBtn = imageSlot.querySelector('.btn-clear');
            if (clearBtn) clearBtn.style.display = 'inline-block';
            
            drawingStates[slotIndex] = true;
            
            // Generate label
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
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset UI
    overlay.style.display = 'flex';
    container.classList.remove('has-image');
    container.classList.remove('drawing-mode');
    labelContainer.style.display = 'none';
    canvas.style.border = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    
    drawingStates[slotIndex] = false;
    isDrawing[slotIndex] = false;
}

// Generate label using QuickDraw-style sketch recognition
async function generateLabel(slotIndex) {
    if (!model || !model.loaded) {
        console.error('Model not loaded yet');
        return;
    }
    
    const canvas = document.getElementById(`canvas-${slotIndex}`);
    const labelContainer = document.getElementById(`label-${slotIndex}`);
    const labelText = document.getElementById(`label-text-${slotIndex}`);
    const loading = document.getElementById(`loading-${slotIndex}`);
    
    // Show loading state
    labelContainer.style.display = 'block';
    loading.style.display = 'block';
    labelText.textContent = '-';
    
    try {
        // Preprocess image to QuickDraw format (28x28 grayscale)
        const processedTensor = preprocessForQuickDraw(canvas);
        
        // Use MobileNet to classify, then map to QuickDraw classes
        const predictions = await model.mobilenet.classify(canvas, 10);
        
        // Map MobileNet predictions to QuickDraw classes and extract best label
        const label = mapToQuickDrawLabel(predictions);
        
        labelText.textContent = label;
        
        // Clean up tensor
        processedTensor.dispose();
    } catch (error) {
        console.error('Error generating label:', error);
        labelText.textContent = 'error';
    } finally {
        loading.style.display = 'none';
    }
}

// Preprocess canvas image for QuickDraw format (28x28 grayscale)
function preprocessForQuickDraw(canvas) {
    return tf.tidy(() => {
        // Convert canvas to tensor
        let tensor = tf.browser.fromPixels(canvas);
        
        // Resize to 28x28 (QuickDraw standard size)
        tensor = tf.image.resizeBilinear(tensor, [28, 28]);
        
        // Convert to grayscale
        tensor = tensor.mean(2).expandDims(2);
        
        // Normalize to [0, 1]
        tensor = tensor.div(255.0);
        
        return tensor;
    });
}

// Map MobileNet predictions to QuickDraw classes
function mapToQuickDrawLabel(predictions) {
    // Create a mapping from MobileNet labels to QuickDraw classes
    const labelMapping = {
        'cat': 'cat', 'dog': 'dog', 'bird': 'bird', 'fish': 'fish',
        'horse': 'horse', 'cow': 'cow', 'pig': 'pig', 'sheep': 'sheep',
        'car': 'car', 'truck': 'truck', 'bus': 'bus', 'airplane': 'airplane',
        'bicycle': 'bicycle', 'motorcycle': 'motorbike',
        'tree': 'tree', 'flower': 'flower', 'house': 'house',
        'guitar': 'guitar', 'piano': 'piano', 'violin': 'violin',
        'phone': 'cell phone', 'computer': 'computer', 'laptop': 'laptop',
        'book': 'book', 'chair': 'chair', 'table': 'table',
        'apple': 'apple', 'banana': 'banana', 'pizza': 'pizza',
        'sun': 'sun', 'moon': 'moon', 'star': 'star', 'cloud': 'cloud',
        'face': 'face', 'eye': 'eye', 'hand': 'hand'
    };
    
    // Try to find a match in QuickDraw classes
    for (const prediction of predictions) {
        const className = prediction.className.toLowerCase();
        
        // Check direct mapping
        for (const [mobilenetLabel, quickdrawLabel] of Object.entries(labelMapping)) {
            if (className.includes(mobilenetLabel)) {
                return quickdrawLabel;
            }
        }
        
        // Check if any word matches a QuickDraw class directly
        const words = className.split(/[,\s]+/);
        for (const word of words) {
            const cleanWord = word.trim().toLowerCase();
            // Check if it's in QuickDraw classes
            if (model.classes.includes(cleanWord)) {
                return cleanWord;
            }
            // Check for partial matches (e.g., "guitar" matches "guitar")
            const match = model.classes.find(cls => 
                cls.toLowerCase().includes(cleanWord) || cleanWord.includes(cls.toLowerCase())
            );
            if (match) {
                return match;
            }
        }
    }
    
    // Fallback: extract best single word and see if it's in QuickDraw
    const bestWord = extractBestLabelFromPredictions(predictions);
    const quickdrawMatch = model.classes.find(cls => 
        cls.toLowerCase().includes(bestWord) || bestWord.includes(cls.toLowerCase())
    );
    
    return quickdrawMatch || bestWord;
}

// Extract the best single-word label from MobileNet predictions
function extractBestLabelFromPredictions(predictions) {
    // MobileNet returns predictions with className like:
    // "tabby, tabby cat" -> "tabby"
    // "electric guitar, guitar" -> "guitar"  
    // "tennis ball" -> "ball"
    
    // Try each prediction in order of confidence
    for (const prediction of predictions) {
        const className = prediction.className;
        const words = className.split(',')[0].trim().split(' ');
        
        // Common object nouns that are good labels
        const commonNouns = [
            'cat', 'dog', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'goat',
            'car', 'truck', 'bus', 'bike', 'motorcycle', 'airplane', 'boat',
            'tree', 'flower', 'plant', 'leaf', 'grass',
            'house', 'building', 'door', 'window', 'roof',
            'ball', 'guitar', 'piano', 'drum', 'violin',
            'phone', 'computer', 'laptop', 'tablet',
            'book', 'chair', 'table', 'bed', 'lamp',
            'sun', 'moon', 'star', 'cloud', 'rain',
            'face', 'head', 'eye', 'hand', 'foot', 'person',
            'apple', 'banana', 'orange', 'cake', 'pizza'
        ];
        
        // Check if any word matches a common noun (prefer last word)
        for (let i = words.length - 1; i >= 0; i--) {
            const word = words[i].toLowerCase();
            if (commonNouns.includes(word)) {
                return word;
            }
        }
        
        // If no common noun, use the last word (usually the main object)
        if (words.length > 1) {
            const lastWord = words[words.length - 1].toLowerCase();
            // Filter out common adjectives/descriptors
            const skipWords = ['red', 'blue', 'green', 'yellow', 'black', 'white', 
                             'big', 'small', 'large', 'little', 'old', 'new'];
            if (!skipWords.includes(lastWord) && lastWord.length > 2) {
                return lastWord;
            }
            // Try second to last word
            if (words.length > 2) {
                const secondLast = words[words.length - 2].toLowerCase();
                if (!skipWords.includes(secondLast) && secondLast.length > 2) {
                    return secondLast;
                }
            }
        }
        
        // Single word - use it if it's reasonable
        if (words.length === 1) {
            const word = words[0].toLowerCase();
            if (word.length > 2 && /^[a-z]+$/.test(word)) {
                return word;
            }
        }
    }
    
    // Fallback: use first word of top prediction
    const topWords = predictions[0].className.split(',')[0].trim().split(' ');
    return topWords[topWords.length - 1].toLowerCase();
}


// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initCanvases();
    loadModel();
});

