function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }



function distanceToLineSegment(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function multiplyColors(color1, color2) {
    if (color1.length !== color2.length) {
        throw new Error('Color arrays must be of the same length');
    }

    return color1.map((value, index) => value * color2[index]);
}

function addColors(color1, color2) {
    if (color1.length !== color2.length) {
        throw new Error('Color arrays must be of the same length');
    }

    return color1.map((value, index) => value + color2[index]);
}


// Push the color values towards 0.5 depending on the factor
function adjustContrast(color, factor) {
    return color.map(value => 0.5 + (value - 0.5) * factor);
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

function initWebGL(canvasID = 'glCanvas') {
    const canvas = document.getElementById(canvasID);
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return null;
    }

    return gl;
}

function getGLCoords(gl, x, y, z = 0) {
    const rect = gl.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    const canvasZ = z;

    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;

    const xCoord = (canvasX / canvasWidth) * 2 - 1;
    const yCoord = 1 - (canvasY / canvasHeight) * 2;

    return [xCoord, yCoord, canvasZ];
}

