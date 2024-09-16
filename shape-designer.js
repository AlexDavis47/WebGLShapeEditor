let gl;
let program;
let positionAttributeLocation;
let colorAttributeLocation;
let colorModLocation;
let layers = [];
let currentLayerIndex = -1;
let isDragging = false;
let selectedVertex = -1;

let snapToGrid = false;
let gridSize = 0.1;

let backgroundColor = [0, 0, 0];

const SELECTION_SENSITIVITY = 0.04;

function initWebGL() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Set canvas size
    const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight) - 40;
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const vertexShaderSource = `
        attribute vec3 a_position;
        attribute vec3 a_color;
        varying vec3 v_color;
        uniform vec4 colorMod;

        void main() {
            gl_Position = vec4(a_position, 1.0);
            v_color = a_color * colorMod.rgb;
            gl_PointSize = 5.0;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        varying vec3 v_color;

        void main() {
            gl_FragColor = vec4(v_color, 1.0);
        }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    // Get attribute and uniform locations
    positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    colorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    colorModLocation = gl.getUniformLocation(program, 'colorMod');

    gl.uniform4f(colorModLocation, 1.0, 1.0, 1.0, 1.0);
}

function draw() {
    gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGridLines();

    layers.forEach((layer, index) => {
        if (layer.vertices.length > 0) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(layer.vertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            const colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(layer.colors), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(colorAttributeLocation);
            gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl[layer.drawMode], 0, layer.vertices.length / 3);

            // Always draw points for better visibility
            gl.drawArrays(gl.POINTS, 0, layer.vertices.length / 3);

            // Highlight the current layer
            if (index === currentLayerIndex) {
                gl.lineWidth(2);
                gl.drawArrays(gl.LINE_LOOP, 0, layer.vertices.length / 3);
            }
        }
    });

    // Draw the vertex indicator
    drawVertexIndicator();
    drawSelectedLayerBoundingBox();

}

class Layer {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.colors = [];
        this.drawMode = 'TRIANGLES';
    }
}

function drawGridLines() {
    if (!snapToGrid) return;

    let lineVertices = [];
    let lineColors = [];

    // Calculate the number of lines based on the grid size
    let numLines = Math.floor(2 / gridSize) + 1;

    let color = adjustContrast(backgroundColor, 0.5);

    // Create vertical lines
    for (let i = 0; i < numLines; i++) {
        let x = -1 + i * gridSize;
        lineVertices.push(x, -1, 0, x, 1, 0);
        lineColors.push(...color, ...color);  // Light gray color
    }

    // Create horizontal lines
    for (let i = 0; i < numLines; i++) {
        let y = -1 + i * gridSize;
        lineVertices.push(-1, y, 0, 1, y, 0);
        lineColors.push(...color, ...color);  // Light gray color
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Draw the grid lines
    gl.drawArrays(gl.LINES, 0, lineVertices.length / 3);
}

function drawVertexIndicator() {
    if (selectedVertex === -1 || currentLayerIndex === -1) return;

    const layer = layers[currentLayerIndex];
    const vertexIndex = selectedVertex * 3;
    const x = layer.vertices[vertexIndex];
    const y = layer.vertices[vertexIndex + 1];

    // Save the current line width and colorMod
    const originalLineWidth = gl.getParameter(gl.LINE_WIDTH);
    const originalColorMod = gl.getUniform(program, colorModLocation);

    // Set line width for the indicator
    gl.lineWidth(3.0);

    // Set colorMod to red
    gl.uniform4f(colorModLocation, 1.0, 0.0, 0.0, 1.0);

    // Draw a square around the selected vertex
    const size = 0.03; // Size of the square, adjust as needed
    const squareVertices = [
        x - size, y - size, 0,
        x + size, y - size, 0,
        x + size, y + size, 0,
        x - size, y + size, 0
    ];

    const squareColors = [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_LOOP, 0, 4);

    // Restore original line width and colorMod
    gl.lineWidth(originalLineWidth);
    gl.uniform4f(colorModLocation, originalColorMod[0], originalColorMod[1], originalColorMod[2], originalColorMod[3]);
}

function addLayer() {
    const layerName = `Layer ${layers.length + 1}`;
    const newLayer = new Layer(layerName);
    if (currentLayerIndex !== -1) {
        newLayer.drawMode = layers[currentLayerIndex].drawMode;
    } else {
        newLayer.drawMode = 'POINTS';
    }
    layers.push(newLayer);
    currentLayerIndex = layers.length - 1;
    updateLayerList();
    draw();
}

function drawSelectedLayerBoundingBox() {
    if (currentLayerIndex === -1) return;

    const layer = layers[currentLayerIndex];
    if (layer.vertices.length === 0) return;

    const minX = Math.min(...layer.vertices.filter((_, i) => i % 3 === 0));
    const maxX = Math.max(...layer.vertices.filter((_, i) => i % 3 === 0));
    const minY = Math.min(...layer.vertices.filter((_, i) => i % 3 === 1));
    const maxY = Math.max(...layer.vertices.filter((_, i) => i % 3 === 1));

    const boundingBoxVertices = [
        minX, minY, 0,
        maxX, minY, 0,
        maxX, maxY, 0,
        minX, maxY, 0
    ];

    const boundingBoxColors = [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boundingBoxVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boundingBoxColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_LOOP, 0, 4);
}



function updateLayerList() {
    const layerList = document.getElementById('layerList');
    layerList.innerHTML = '';
    layers.forEach((layer, index) => {
        const layerContainer = document.createElement('div');
        layerContainer.className = 'layerButton' + (index === currentLayerIndex ? ' selected' : '');

        const layerName = document.createElement('span');
        layerName.textContent = layer.name;
        layerName.onclick = () => selectLayer(index);

        const copyButtons = document.createElement('div');
        copyButtons.className = 'layerCopyButtons';

        const copyVerticesButton = createCopyButton('V', () => copyToClipboard(JSON.stringify(layer.vertices)));
        const copyColorsButton = createCopyButton('C', () => copyToClipboard(JSON.stringify(layer.colors)));
        const copyIndicesButton = createCopyButton('I', () => copyToClipboard(JSON.stringify(generateIndices(layer.vertices))));

        copyButtons.appendChild(copyVerticesButton);
        copyButtons.appendChild(copyColorsButton);
        copyButtons.appendChild(copyIndicesButton);

        layerContainer.appendChild(layerName);
        layerContainer.appendChild(copyButtons);
        layerList.appendChild(layerContainer);
    });
}
function selectLayer(index) {
    currentLayerIndex = index;
    updateLayerList();
    document.getElementById('drawMode').value = layers[currentLayerIndex].drawMode;
    draw();
}


function getGLCoords(x, y) {
    const rect = gl.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    let glX = (canvasX / gl.canvas.width) * 2 - 1;
    let glY = -((canvasY / gl.canvas.height) * 2 - 1);

    // Apply grid snapping if enabled
    if (snapToGrid) {
        glX = Math.round(glX / gridSize) * gridSize;
        glY = Math.round(glY / gridSize) * gridSize;
    }
    return { glX, glY };
}


function addVertex(x, y) {
    if (currentLayerIndex === -1) return -1;

    const layer = layers[currentLayerIndex];

    const { glX, glY } = getGLCoords(x, y);

    const insertIndex = findInsertionPoint(layer, glX, glY);

    // Insert the new vertex
    layer.vertices.splice(insertIndex, 0, glX, glY, 0);

    // Insert the color for the new vertex
    const colorPicker = document.getElementById('colorPicker');
    const color = hexToRgb(colorPicker.value);
    layer.colors.splice(insertIndex, 0, color.r / 255, color.g / 255, color.b / 255);

    draw();
    return insertIndex / 3; // Return the index of the new vertex
}


function getNearestVertex(x, y) {
    if (currentLayerIndex === -1) return -1;

    const rect = gl.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    const glX = (canvasX / gl.canvas.width) * 2 - 1;
    const glY = -((canvasY / gl.canvas.height) * 2 - 1);

    let minDist = Infinity;
    let nearestIndex = -1;
    const vertices = layers[currentLayerIndex].vertices;

    for (let i = 0; i < vertices.length; i += 3) {
        const dx = vertices[i] - glX;
        const dy = vertices[i + 1] - glY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
            minDist = dist;
            nearestIndex = i / 3;
        }

    }
    if (minDist < SELECTION_SENSITIVITY) {
        selectVertex(nearestIndex);
        return nearestIndex;
    }
    return -1;
}
function setVertexColor(index) {
    if (currentLayerIndex === -1) return;

    const colorPicker = document.getElementById('colorPicker');
    const color = hexToRgb(colorPicker.value);
    const colors = layers[currentLayerIndex].colors;
    colors[index * 3] = color.r / 255;
    colors[index * 3 + 1] = color.g / 255;
    colors[index * 3 + 2] = color.b / 255;
    draw();
}

function exportShape() {
    const modelName = document.getElementById('modelName').value.trim();
    if (!modelName) {
        alert('Please enter a model name');
        return;
    }

    const className = 'Model2D_' + modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const fileName = `model2D_${modelName.toLowerCase()}.js`;

    let shapesCode = layers.map((layer) => {
        const verticesStr = JSON.stringify(layer.vertices);
        const colorsStr = JSON.stringify(layer.colors);
        const indicesStr = JSON.stringify(generateIndices(layer.vertices));
        return `    this.addShape(
            ${verticesStr},
            ${colorsStr},
            ${indicesStr},
            this.gl.${layer.drawMode}
        );`
    }).join('\n\n');

    const output = `class ${className} extends Model2D {
    constructor(gl) {
        super(gl);
        this.initShape();
    }

    initShape() {
${shapesCode}
    }
}`;

    downloadFile(fileName, output);
}

function clearLayer() {
    if (currentLayerIndex !== -1) {
        layers[currentLayerIndex].vertices = [];
        layers[currentLayerIndex].colors = [];
        draw();
    }
}

function generateIndices(vertices) {
    let indices = [];

    if (vertices.length <= 9) { // 3 vertices or fewer
        for (let i = 0; i < vertices.length / 3; i++) {
            indices.push(i);
        }
    } else {
        // For shapes with more than 3 vertices, we'll use a triangle fan approach
        // This assumes the vertices are in a counter-clockwise order
        for (let i = 1; i < vertices.length / 3 - 1; i++) {
            indices.push(0, i, i + 1);
        }
    }

    return indices;
}
function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function deleteLayer() {
    if (currentLayerIndex !== -1) {
        layers.splice(currentLayerIndex, 1);
        currentLayerIndex = -1;
        updateLayerList();
        draw();
    }
}

function deleteVertex() {
    if (selectedVertex !== -1 && currentLayerIndex !== -1) {
        layers[currentLayerIndex].vertices.splice(selectedVertex * 3, 3);
        layers[currentLayerIndex].colors.splice(selectedVertex * 3, 3);
        selectedVertex = -1;
        updateVertexEditor();
        draw();
    }
}

function findInsertionPoint(layer, newX, newY) {
    if (layer.vertices.length < 6) {
        // If there are fewer than 2 vertices, add to the end
        return layer.vertices.length;
    }

    let minDistance = Infinity;
    let insertIndex = 0;

    for (let i = 0; i < layer.vertices.length; i += 3) {
        const nextIndex = (i + 3) % layer.vertices.length;
        const x1 = layer.vertices[i];
        const y1 = layer.vertices[i + 1];
        const x2 = layer.vertices[nextIndex];
        const y2 = layer.vertices[nextIndex + 1];

        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(newX, newY, x1, y1, x2, y2);

        if (distance < minDistance) {
            minDistance = distance;
            insertIndex = nextIndex;
        }
    }

    return insertIndex;
}

function updateVertexPosition(x, y) {
    if (currentLayerIndex === -1 || selectedVertex === -1) return;

    const { glX, glY } = getGLCoords(x, y);

    const vertices = layers[currentLayerIndex].vertices;
    vertices[selectedVertex * 3] = glX;
    vertices[selectedVertex * 3 + 1] = glY;

    updateVertexEditor();
}

function updateGridEnabled() {
    snapToGrid = document.getElementById('gridEnabled').checked;
    draw();
}

function updateGridSize() {
    gridSize = parseFloat(document.getElementById('gridSize').value);
    draw();
}



function createCopyButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'copyButton';
    button.textContent = text;
    button.onclick = onClick;
    return button;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard');
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}

document.getElementById('copyAllLayers').addEventListener('click', () => {
    const allLayersData = layers.map(layer => ({
        name: layer.name,
        vertices: layer.vertices,
        colors: layer.colors,
        indices: generateIndices(layer.vertices),
        drawMode: layer.drawMode
    }));
    copyToClipboard(JSON.stringify(allLayersData, null, 2));
});

window.onload = function() {
    initWebGL();

    let colorModLoc = gl.getUniformLocation(program, "colorModifier");
    gl.uniform4f(colorModLoc, 1, 1, 1, 1); // Initialize to white

    const canvas = document.getElementById('glCanvas');
    const addLayerButton = document.getElementById('addLayer');
    const setColorButton = document.getElementById('setColor');
    const exportButton = document.getElementById('exportButton');
    const clearLayerButton = document.getElementById('clearLayer');
    const drawModeSelect = document.getElementById('drawMode');
    const deleteLayerButton = document.getElementById('deleteLayer');
    const deleteVertexButton = document.getElementById('deleteVertex');

    const updateVertexX = document.getElementById('vertexX');
    const updateVertexY = document.getElementById('vertexY');
    const updateVertexR = document.getElementById('vertexR');
    const updateVertexG = document.getElementById('vertexG');
    const updateVertexB = document.getElementById('vertexB');

    const gridEnabledCheckbox = document.getElementById('gridEnabled');
    const gridSizeInput = document.getElementById('gridSize');

    const backgroundColorInput = document.getElementById('canvasColor');

    // Init the grid size html element
    gridSizeInput.value = gridSize;

    backgroundColorInput.value = '#000000';

    backgroundColorInput.addEventListener('input', function() {
        const color = hexToRgb(this.value);
        backgroundColor = [color.r / 255, color.g / 255, color.b / 255];
        draw();
    });


    gridEnabledCheckbox.addEventListener('change', updateGridEnabled);
    gridSizeInput.addEventListener('input', updateGridSize);


    updateVertexX.addEventListener('input', updateVertexFromEditor);
    updateVertexY.addEventListener('input', updateVertexFromEditor);
    updateVertexR.addEventListener('input', updateVertexFromEditor);
    updateVertexG.addEventListener('input', updateVertexFromEditor);
    updateVertexB.addEventListener('input', updateVertexFromEditor);

    deleteLayerButton.addEventListener('click', deleteLayer);
    deleteVertexButton.addEventListener('click', deleteVertex);

    setColorButton.addEventListener('click', function() { //TODO: Improve this
        if (selectedVertex !== -1 && currentLayerIndex !== -1) {
            setVertexColor(selectedVertex);
            draw();
        }
    });

    addLayerButton.addEventListener('click', addLayer);

    canvas.addEventListener('mousedown', function(e) {
        if (currentLayerIndex === -1) return;

        if (e.button === 0) { // Left click
            const nearestVertex = getNearestVertex(e.clientX, e.clientY);
            if (nearestVertex === -1) {
                const newVertexIndex = addVertex(e.clientX, e.clientY);
                if (newVertexIndex !== -1) {
                    selectVertex(newVertexIndex);
                    isDragging = true;
                }
            } else {
                selectVertex(nearestVertex);
                isDragging = true;
            }
            draw();
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        if (isDragging && selectedVertex !== -1 && currentLayerIndex !== -1) {
            updateVertexPosition(e.clientX, e.clientY);
            draw();
        }
    });

    canvas.addEventListener('mouseup', function(e) {
        if (e.button === 0) { // Left click release
            isDragging = false;
        }
    });

    setColorButton.addEventListener('click', function() {
        if (currentLayerIndex !== -1) {
            canvas.addEventListener('click', setColorListener);
        }
    });

    exportButton.addEventListener('click', exportShape);

    clearLayerButton.addEventListener('click', clearLayer);

    drawModeSelect.addEventListener('change', function() {
        if (currentLayerIndex !== -1) {
            layers[currentLayerIndex].drawMode = this.value;
            draw();
        }
    });

    function setColorListener(e) {
        if (currentLayerIndex !== -1) {
            const index = getNearestVertex(e.clientX, e.clientY);
            if (index !== -1) {
                setVertexColor(index);
            }
            canvas.removeEventListener('click', setColorListener);
        }
    }

    addLayer();
};


function selectVertex(index) {
    selectedVertex = index;
    updateVertexEditor();
    draw();
}

function updateVertexEditor() {
    const editor = document.getElementById('vertexEditor');
    if (selectedVertex === -1 || currentLayerIndex === -1) {
        editor.style.display = 'none';
        return;
    }

    editor.style.display = 'block';
    const layer = layers[currentLayerIndex];
    const vertexIndex = selectedVertex * 3;
    const colorIndex = selectedVertex * 3;

    document.getElementById('vertexX').value = layer.vertices[vertexIndex].toFixed(2);
    document.getElementById('vertexY').value = layer.vertices[vertexIndex + 1].toFixed(2);
    document.getElementById('vertexR').value = layer.colors[colorIndex].toFixed(2);
    document.getElementById('vertexG').value = layer.colors[colorIndex + 1].toFixed(2);
    document.getElementById('vertexB').value = layer.colors[colorIndex + 2].toFixed(2);
}

function updateVertexFromEditor() {
    if (selectedVertex === -1 || currentLayerIndex === -1) return;

    const layer = layers[currentLayerIndex];
    const vertexIndex = selectedVertex * 3;
    const colorIndex = selectedVertex * 3;

    layer.vertices[vertexIndex] = parseFloat(document.getElementById('vertexX').value);
    layer.vertices[vertexIndex + 1] = parseFloat(document.getElementById('vertexY').value);
    layer.colors[colorIndex] = parseFloat(document.getElementById('vertexR').value);
    layer.colors[colorIndex + 1] = parseFloat(document.getElementById('vertexG').value);
    layer.colors[colorIndex + 2] = parseFloat(document.getElementById('vertexB').value);

    draw();
}