in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uBoardTex;

void main(void) {
  finalColor = texture(uBoardTex, vTextureCoord);
}
