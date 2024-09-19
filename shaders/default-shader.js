class DefaultShader extends AbstractShader {
    constructor() {
        super();
        this.vertexShaderSource = `
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
        this.fragmentShaderSource = `
        precision mediump float;
        varying vec3 v_color;

        void main() {
            gl_FragColor = vec4(v_color, 1.0);
        }
    `;
    }
}