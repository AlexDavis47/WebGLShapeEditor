class ShapeEditor2D extends AbstractShapeEditor {
    constructor() {
        super();
    }

    drawGridLines() {
        if (!this.gridLinesEnabled || this.previewMode) return;

        const gridVertices = [];
        const gridColors = [];
        const numLines = Math.floor(2 / this.gridSize) + 1;
        const color = this.adjustContrast(this.hexToRgb(this.canvasColor), 0.5);

        for (let i = 0; i < numLines; i++) {
            let pos = -1 + i * this.gridSize;
            // Vertical lines
            gridVertices.push(pos, -1, 0, pos, 1, 0);
            // Horizontal lines
            gridVertices.push(-1, pos, 0, 1, pos, 0);
            // Colors for both lines
            gridColors.push(...color, ...color, ...color, ...color);
        }

        this.drawLines(gridVertices, gridColors);
    }

    drawLayers() {
        this.layers.forEach((layer, index) => {
            if (layer.vertices.length > 0) {
                this.drawShape(layer.vertices, layer.colors, layer.drawMode);
                
                if (index === this.selectedLayerIndex) {
                    // Draw vertices
                    this.drawPoints(layer.vertices, layer.colors);
                    // Draw outline
                    this.drawLines(layer.vertices, layer.colors);
                }
            }
        });
    }

    drawSelectedVertex() {
        if (this.selectedVertexIndex === -1 || this.selectedLayerIndex === -1) return;

        const layer = this.layers[this.selectedLayerIndex];
        const vertexIndex = this.selectedVertexIndex * 3;
        const x = layer.vertices[vertexIndex];
        const y = layer.vertices[vertexIndex + 1];

        const size = 0.03;
        const squareVertices = [
            x - size, y - size, 0,
            x + size, y - size, 0,
            x + size, y + size, 0,
            x - size, y + size, 0
        ];

        const squareColors = new Array(12).fill(1); // White color

        this.drawLines(squareVertices, squareColors);
    }

    drawSelectedLayerBoundingBox() {
        if (this.selectedLayerIndex === -1) return;

        const layer = this.layers[this.selectedLayerIndex];
        if (layer.vertices.length === 0) return;

        const minX = Math.min(...layer.vertices.filter((_, i) => i % 3 === 0));
        const maxX = Math.max(...layer.vertices.filter((_, i) => i % 3 === 0));
        const minY = Math.min(...layer.vertices.filter((_, i) => i % 3 === 1));
        const maxY = Math.max(...layer.vertices.filter((_, i) => i % 3 === 1));

        const boundingBoxVertices = [
            minX, minY, 0,
            maxX, minY, 0,
            maxX, maxY, 0,
            minX, maxY, 0,
            minX, minY, 0
        ];

        const boundingBoxColor = this.adjustContrast(this.hexToRgb(this.canvasColor), 0.7);
        const boundingBoxColors = new Array(15).fill(boundingBoxColor.r, boundingBoxColor.g, boundingBoxColor.b);

        this.drawLines(boundingBoxVertices, boundingBoxColors);
    }

    addVertex(x, y) {
        if (this.selectedLayerIndex === -1) return -1;

        const layer = this.layers[this.selectedLayerIndex];
        const {glX, glY} = this.getGLCoords(x, y);
        const insertIndex = this.findInsertionPoint(glX, glY);

        // Insert the new vertex
        layer.vertices.splice(insertIndex, 0, glX, glY, 0);

        // Get the color from the color picker
        const colorPicker = document.getElementById('colorPicker');
        const color = this.hexToRgb(colorPicker.value);

        // Insert the color for the new vertex
        layer.colors.splice(insertIndex, 0, color.r, color.g, color.b);

        this.draw();
        return insertIndex / 3; // Return the index of the new vertex
    }

    // Helper methods
    drawShape(vertices, colors, drawMode) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.colorAttributeLocation);
        this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl[drawMode], 0, vertices.length / 3);
    }

    drawLines(vertices, colors) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.colorAttributeLocation);
        this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 3);
    }

    drawPoints(vertices, colors) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.colorAttributeLocation);
        this.gl.vertexAttribPointer(this.colorAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.POINTS, 0, vertices.length / 3);
    }

    adjustContrast(color, factor) {
        return {
            r: Math.min(1, Math.max(0, color.r + (0.5 - color.r) * factor)),
            g: Math.min(1, Math.max(0, color.g + (0.5 - color.g) * factor)),
            b: Math.min(1, Math.max(0, color.b + (0.5 - color.b) * factor))
        };
    }
}