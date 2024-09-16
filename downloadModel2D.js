function downloadModel2D() {
    const model2DContent = `class Model2D {
    constructor(gl) {
        this.gl = gl;
        this.shapes = [];
    }

    addShape(vertices, colors, indices, drawMode) {
        this.shapes.push({
            vertices: vertices,
            colors: colors,
            indices: indices,
            drawMode: drawMode,
            vertexBuffer: null,
            colorBuffer: null,
            indexBuffer: null
        });
        this.initBuffers(this.shapes[this.shapes.length - 1]);
    }

    initBuffers(shape) {
        // Create and bind vertex buffer
        shape.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shape.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(shape.vertices), this.gl.STATIC_DRAW);

        // Create and bind color buffer
        shape.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shape.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(shape.colors), this.gl.STATIC_DRAW);

        // Create and bind index buffer if indices are provided
        if (shape.indices) {
            shape.indexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), this.gl.STATIC_DRAW);
        }

        // Clean up
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
    
    // Call this method in your drawing loop to render the shapes
    draw(program) { 
        for (let shape of this.shapes) {
            // Bind vertex buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shape.vertexBuffer);
            this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(0);

            // Bind color buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shape.colorBuffer);
            this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(1);

            if (shape.indices) {
                // Bind index buffer
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
                // Draw the shape
                this.gl.drawElements(shape.drawMode, shape.indices.length, this.gl.UNSIGNED_SHORT, 0);
            } else {
                // Draw the shape without indices
                this.gl.drawArrays(shape.drawMode, 0, shape.vertices.length / 3);
            }
        }

        // Clean up
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
}`;

    downloadFile('model2D.js', model2DContent);


}