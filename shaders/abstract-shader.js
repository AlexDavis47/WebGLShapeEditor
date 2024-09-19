// This should be extended by all shaders
class AbstractShader {
    constructor() {
        this.fragmentShaderSource = '';
        this.vertexShaderSource = '';

        if (this.constructor === AbstractShader) {
            throw new Error('Shader abstract class cannot be instantiated, extend it!');
        }
    }
}