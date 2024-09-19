class AbstractShapeEditor {
    constructor() {
        this.gl = null; // webgl context
        this.program = null; // webgl program, active vertex shader and fragment shader
        this.positionAttributeLocation = null; // position attribute location
        this.colorAttributeLocation = null; // color attribute location
        this.colorModUniformLocation = null; // color modifier uniform location
        this.canvas = null; // glCanvas from the HTML
        this.canvasWidth = 0; // canvas width
        this.canvasHeight = 0; // canvas height
        this.layers = [];
        this.selectedLayerIndex = -1;
        this.isDragging = false;
        this.selectedVertexIndex = -1;
        this.snapToGrid = false;
        this.gridSize = 0.1;
        this.canvasColor = '#000000';
        this.vertexColor = '#ffffff'; // Retrieve this color from the HTML UI
        this.VERTEX_SELECTION_RADIUS = 0.05;
        this.gridLinesEnabled = true;
        this.floatPrecision = 3;
    }

    init() {
        this.gl = this.initWebGL();
        this.canvas = this.gl.canvas;
        this.canvasHeight = this.canvas.height;
        this.canvasWidth = this.canvas.width;
        this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
        let shader = new DefaultShader(); //TODO: This is maybe not a great way to handle the shaders, since we have to get the uniforms and stuff too
        // Maybe we should have the shader class also handle uniforms and stuff.
        this.program = this.createProgram(this.gl, shader.vertexShaderSource, shader.fragmentShaderSource);
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.colorAttributeLocation = this.gl.getAttribLocation(this.program, 'a_color');
        this.colorModUniformLocation = this.gl.getUniformLocation(this.program, 'u_colorMod');
        this.gl.useProgram(this.program);
        this.initWebGL();
        this.setupEventListeners();
        this.initializeColorPicker();
        this.draw();
    }

    initWebGL() {
        const canvas = document.getElementById('glCanvas');
        const gl = canvas.getContext('webgl');
        if (!gl) {
            throw new Error('Unable to initialize WebGL. Your browser may not support it.');
        }
        return gl;
    }

    createProgram(gl, vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        }
        return program;
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    draw() {
        this.gl.clearColor(...this.hexToRgb(this.canvasColor), 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        if (this.gridLinesEnabled) this.drawGridLines();
        this.drawLayers();
        this.drawSelectedVertex();
        this.drawSelectedLayerBoundingBox();
    }

    drawGridLines() {
        throw new Error('Abstract method drawGridLines not implemented');
    }

    drawLayers() {
        throw new Error('Abstract method drawLayers not implemented');
    }

    drawSelectedVertex() {
        throw new Error('Abstract method drawSelectedVertex not implemented');
    }

    drawSelectedLayerBoundingBox() {
        throw new Error('Abstract method drawSelectedLayer not implemented');
    }

    addLayer() {
        let layerName = `Layer ${this.layers.length + 1}`;
        let newLayer = new Layer(layerName);
        if (this.selectedLayerIndex !== -1) {
            newLayer.drawMode = this.layers[this.selectedLayerIndex].drawMode;
        } else {
            newLayer.drawMode = 'POINTS';
        }
        this.layers.push(newLayer);
        this.selectedLayerIndex = this.layers.length - 1;
        this.updateLayerList();
        this.draw();
    }

    deleteLayer() {
        if (this.selectedLayerIndex !== -1) {
            this.layers.splice(this.selectedLayerIndex, 1);
            this.selectedLayerIndex = -1;
            this.updateLayerList();
            this.draw();
        }
    }

    clearLayer() {
        if (this.selectedLayerIndex !== -1) {
            this.layers[this.selectedLayerIndex].vertices = [];
            this.layers[this.selectedLayerIndex].colors = [];
            this.draw();
        }
    }

    selectLayer(index) {
        this.selectedLayerIndex = index;
        this.updateLayerList();
        document.getElementById('drawMode').value = this.layers[this.selectedLayerIndex].drawMode;
        this.draw();
    }

    addVertex(x, y, z) {
        throw new Error('Abstract method addVertex not implemented');
    }

    deleteVertex() {
        if (this.selectedVertexIndex !== -1 && this.selectedLayerIndex !== -1) {
            this.layers[this.selectedLayerIndex].vertices.splice(this.selectedVertexIndex * 3, 3);
            this.layers[this.selectedLayerIndex].colors.splice(this.selectedVertexIndex * 3, 3);
            this.selectedVertexIndex = -1;
            this.updateVertexEditor();
            this.draw();
        }
    }

    updateVertexPosition(x, y, z = 0) {
        if (this.selectedLayerIndex === -1 || this.selectedVertexIndex === -1) return;

        const {glX, glY, glZ} = this.getGLCoords(x, y, z);

        const vertices = this.layers[this.selectedLayerIndex].vertices;
        vertices[this.selectedVertexIndex * 3] = glX;
        vertices[this.selectedVertexIndex * 3 + 1] = glY;
        vertices[this.selectedVertexIndex * 3 + 2] = glZ;

        this.updateVertexEditor();
    }

    setVertexColor() {
        if (this.selectedLayerIndex === -1 || this.selectedVertexIndex === -1) return;

        const colorPicker = document.getElementById('colorPicker');
        const color = this.hexToRgb(colorPicker.value);
        const colors = this.layers[this.selectedLayerIndex].colors;
        const index = this.selectedVertexIndex * 3;

        colors[index] = color.r / 255;
        colors[index + 1] = color.g / 255;
        colors[index + 2] = color.b / 255;

        this.updateVertexEditor();
        this.draw();
    }

    selectVertex(index) {
        this.selectedVertexIndex = index;
        this.updateVertexEditor();
        this.draw();
    }

    getNearestVertex(x, y, z = 0) {
        if (this.selectedLayerIndex === -1) return -1;

        let {glX, glY, glZ} = this.getGLCoords(x, y, z);
        let nearestIndex = -1;
        let vertices = this.layers[this.selectedLayerIndex].vertices;
        let minDistance = Number.MAX_VALUE;

        for (let i = 0; i < vertices.length; i += 3) {
            let dx = vertices[i] - glX;
            let dy = vertices[i + 1] - glY;
            let dz = vertices[i + 2] - glZ;
            let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i / 3;
            }
        }
        if (minDistance < this.VERTEX_SELECTION_RADIUS) {
            return nearestIndex;
        }
        return -1;
    }

    findInsertionPoint(x, y, z = 0) {
        if (this.selectedLayerIndex === -1) return -1;

        const {glX, glY, glZ} = this.getGLCoords(x, y, z);
        const vertices = this.layers[this.selectedLayerIndex].vertices;
        let minDistance = Number.MAX_VALUE;
        let insertIndex = vertices.length;

        for (let i = 0; i < vertices.length; i += 3) {
            const nextIndex = (i + 3) % vertices.length;
            const x1 = vertices[i], y1 = vertices[i + 1], z1 = vertices[i + 2];
            const x2 = vertices[nextIndex], y2 = vertices[nextIndex + 1], z2 = vertices[nextIndex + 2];

            const distance = this.distanceToLineSegment(glX, glY, glZ, x1, y1, z1, x2, y2, z2);

            if (distance < minDistance) {
                minDistance = distance;
                insertIndex = nextIndex;
            }
        }

        return insertIndex;
    }

    distanceToLineSegment(x, y, z, x1, y1, z1, x2, y2, z2) {
        const A = x - x1;
        const B = y - y1;
        const C = z - z1;
        const D = x2 - x1;
        const E = y2 - y1;
        const F = z2 - z1;

        const dot = A * D + B * E + C * F;
        const len_sq = D * D + E * E + F * F;
        let param = -1;
        if (len_sq != 0) param = dot / len_sq;

        let xx, yy, zz;

        if (param < 0) {
            xx = x1;
            yy = y1;
            zz = z1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
            zz = z2;
        } else {
            xx = x1 + param * D;
            yy = y1 + param * E;
            zz = z1 + param * F;
        }

        const dx = x - xx;
        const dy = y - yy;
        const dz = z - zz;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    updateLayerList() {
        const layerList = document.getElementById('layerList');
        layerList.innerHTML = '';
        this.layers.forEach((layer, index) => {
            const layerContainer = document.createElement('div');
            layerContainer.className = 'layerButton' + (index === this.selectedLayerIndex ? ' selected' : '');

            const layerName = document.createElement('span');
            layerName.textContent = layer.name;
            layerName.onclick = () => this.selectLayer(index);

            const copyButtons = document.createElement('div');
            copyButtons.className = 'layerCopyButtons';

            const copyVerticesButton = this.createCopyButton(
                'assets/vertex.png',
                'Copy Vertices',
                () => this.copyToClipboard(this.getVerticesString(index))
            );
            const copyColorsButton = this.createCopyButton(
                'assets/colors.png',
                'Copy Colors',
                () => this.copyToClipboard(this.getColorsString(index))
            );
            const copyIndicesButton = this.createCopyButton(
                'assets/indices.png',
                'Copy Indices',
                () => this.copyToClipboard(this.getIndicesString(index))
            );

            copyButtons.appendChild(copyVerticesButton);
            copyButtons.appendChild(copyColorsButton);
            copyButtons.appendChild(copyIndicesButton);

            layerContainer.appendChild(layerName);
            layerContainer.appendChild(copyButtons);
            layerList.appendChild(layerContainer);
        });

        // Initialize tooltips for the new buttons
        tippy('.copyButton'); // TODO: Temporarily initializing tooltips in here, it should be done in tooltips.js somehow.
    }

    updateVertexEditor() {
        let editor = document.getElementById('vertexEditor');
        if (this.selectedVertexIndex === -1 || this.selectedLayerIndex === -1) {
            editor.style.display = 'none';
            return;
        }

        editor.style.display = 'block';
        let layer = this.layers[this.selectedLayerIndex];
        let vertexIndex = this.selectedVertexIndex * 3;

        document.getElementById('vertexX').value = layer.vertices[vertexIndex].toFixed(this.floatPrecision);
        document.getElementById('vertexY').value = layer.vertices[vertexIndex + 1].toFixed(this.floatPrecision);
        document.getElementById('vertexZ').value = layer.vertices[vertexIndex + 2].toFixed(this.floatPrecision);

        document.getElementById('vertexR').value = layer.colors[vertexIndex].toFixed(this.floatPrecision);
        document.getElementById('vertexG').value = layer.colors[vertexIndex + 1].toFixed(this.floatPrecision);
        document.getElementById('vertexB').value = layer.colors[vertexIndex + 2].toFixed(this.floatPrecision);
    }

    updateVertexFromEditor() {
        if (this.selectedVertexIndex === -1 || this.selectedLayerIndex === -1) return;

        let layer = this.layers[this.selectedLayerIndex];
        let vertexIndex = this.selectedVertexIndex * 3;

        layer.vertices[vertexIndex] = parseFloat(document.getElementById('vertexX').value);
        layer.vertices[vertexIndex + 1] = parseFloat(document.getElementById('vertexY').value);
        layer.vertices[vertexIndex + 2] = parseFloat(document.getElementById('vertexZ').value);

        layer.colors[vertexIndex] = parseFloat(document.getElementById('vertexR').value);
        layer.colors[vertexIndex + 1] = parseFloat(document.getElementById('vertexG').value);
        layer.colors[vertexIndex + 2] = parseFloat(document.getElementById('vertexB').value);

        this.draw();
    }

    exportShape() {
        let modelName = document.getElementById('modelName').value.trim();
        if (!modelName) {
            alert('Please enter a model name');
            return;
        }

        let className = 'Model2D_' + modelName.charAt(0).toUpperCase() + modelName.slice(1);
        let fileName = `model2D_${modelName.toLowerCase()}.js`;

        let shapesCode = this.layers.map((layer) => {
            const verticesStr = JSON.stringify(layer.vertices);
            const colorsStr = JSON.stringify(layer.colors);
            const indicesStr = JSON.stringify(this.generateIndices(layer.vertices));
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

        this.downloadFile(fileName, output);
    }

    generateIndices(vertices) {
        let indices = [];

        if (vertices.length <= 9) {
            for (let i = 0; i < vertices.length / 3; i++) {
                indices.push(i);
            }
        } else {
            for (let i = 1; i < vertices.length / 3 - 1; i++) {
                indices.push(0, i, i + 1);
            }
        }

        return indices;
    }

    initializeColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.value = '#FFFFFF';  // Set to white
    }

    // Utility methods
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }

    getGLCoords(x, y, z = 0) {
        const rect = this.canvas.getBoundingClientRect();
        let glX = (x - rect.left) / this.canvasWidth * 2 - 1;
        let glY = 1 - (y - rect.top) / this.canvasHeight * 2;
        let glZ = z;

        if (this.snapToGrid) {
            glX = Math.round(glX / this.gridSize) * this.gridSize;
            glY = Math.round(glY / this.gridSize) * this.gridSize;
            glZ = Math.round(glZ / this.gridSize) * this.gridSize;
        }

        return {glX, glY, glZ};
    }

    createCopyButton(iconSrc, tooltipContent, onClick) {
        const button = document.createElement('button');
        button.className = 'copyButton';

        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.alt = tooltipContent;
        button.appendChild(icon);

        button.onclick = onClick;
        button.setAttribute('data-tippy-content', tooltipContent);

        return button;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    }

    getVerticesString(layerIndex) {
        const vertices = this.layers[layerIndex].vertices;
        return `const vertices = [\n    ${this.formatArray(vertices, 3)}\n];`;
    }

    getColorsString(layerIndex) {
        const colors = this.layers[layerIndex].colors;
        return `const colors = [\n    ${this.formatArray(colors, 3)}\n];`;
    }

    getIndicesString(layerIndex) {
        const vertices = this.layers[layerIndex].vertices;
        const indices = this.generateIndices(vertices);
        return `const indices = [${indices.join(', ')}];`;
    }

    formatArray(arr, groupSize) {
        return arr.reduce((result, value, index) => {
            if (index % groupSize === 0) {
                result += index === 0 ? '' : ',\n    ';
            }
            result += value.toFixed(this.floatPrecision);
            if (index % groupSize !== groupSize - 1 && index !== arr.length - 1) {
                result += ', ';
            }
            return result;
        }, '');
    }

    downloadFile(fileName, content) {
        const blob = new Blob([content], {type: 'text/javascript'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Event handlers
    handleCanvasMouseDown(e) {
        if (this.selectedLayerIndex === -1) return;

        if (e.button === 0) { // Left click
            const nearestVertex = this.getNearestVertex(e.clientX, e.clientY);
            if (nearestVertex === -1) {
                const newVertexIndex = this.addVertex(e.clientX, e.clientY);
                if (newVertexIndex !== -1) {
                    this.selectVertex(newVertexIndex);
                    this.isDragging = true;
                }
            } else {
                this.selectVertex(nearestVertex);
                this.isDragging = true;
            }
            this.draw();
        }
    }

    handleCanvasMouseMove(e) {
        if (this.isDragging && this.selectedVertexIndex !== -1 && this.selectedLayerIndex !== -1) {
            this.updateVertexPosition(e.clientX, e.clientY);
            this.draw();
        }
    }

    handleCanvasMouseUp(e) {
        if (e.button === 0) { // Left click release
            this.isDragging = false;
        }
    }

    updateGridEnabled(enabled) {
        this.gridLinesEnabled = enabled;
        this.draw();
    }

    updateGridSize(size) {
        this.gridSize = parseFloat(size);
        this.draw();
    }

    updateBackgroundColor(color) {
        this.canvasColor = color;
        this.draw();
    }

    updateDrawMode(mode) {
        if (this.selectedLayerIndex !== -1) {
            this.layers[this.selectedLayerIndex].drawMode = mode;
            this.draw();
        }
    }

    // Setup methods
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));

        document.getElementById('addLayer').addEventListener('click', this.addLayer.bind(this));
        document.getElementById('setColor').addEventListener('click', this.setVertexColor.bind(this));
        document.getElementById('exportButton').addEventListener('click', this.exportShape.bind(this));
        document.getElementById('clearLayer').addEventListener('click', this.clearLayer.bind(this));
        document.getElementById('deleteLayer').addEventListener('click', this.deleteLayer.bind(this));
        document.getElementById('deleteVertex').addEventListener('click', this.deleteVertex.bind(this));
        document.getElementById('gridEnabled').addEventListener('change', (e) => this.updateGridEnabled(e.target.checked));
        document.getElementById('gridSize').addEventListener('input', (e) => this.updateGridSize(e.target.value));
        document.getElementById('canvasColor').addEventListener('input', (e) => this.updateBackgroundColor(e.target.value));
        document.getElementById('drawMode').addEventListener('change', (e) => this.updateDrawMode(e.target.value));

        document.getElementById('vertexX').addEventListener('input', this.updateVertexFromEditor.bind(this));
        document.getElementById('vertexY').addEventListener('input', this.updateVertexFromEditor.bind(this));
        document.getElementById('vertexZ').addEventListener('input', this.updateVertexFromEditor.bind(this));
        document.getElementById('vertexR').addEventListener('input', this.updateVertexFromEditor.bind(this));
        document.getElementById('vertexG').addEventListener('input', this.updateVertexFromEditor.bind(this));
        document.getElementById('vertexB').addEventListener('input', this.updateVertexFromEditor.bind(this));
    }
}

class Layer {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.colors = [];
        this.drawMode = 'TRIANGLES';
    }
}