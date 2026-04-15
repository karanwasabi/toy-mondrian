import { Filter } from 'pixi.js';

const FILTER_VERTEX_SOURCE = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}
`;

const FILTER_FRAGMENT_SOURCE = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uBoardTex;
uniform vec2 uBoardSize;
uniform float uLineThickness;
uniform vec4 uBorderColor;
uniform vec4 uBgColor;

float occupied(vec4 sampleColor) {
  return step(0.5, sampleColor.a);
}

float colorMismatch(vec3 a, vec3 b) {
  return step(0.001, distance(a, b));
}

void main(void) {
  vec2 texel = 1.0 / uBoardSize;
  vec2 uv = clamp(vTextureCoord, vec2(0.0), vec2(1.0));
  vec2 cellLocal = fract(uv * uBoardSize);

  vec4 current = texture(uBoardTex, uv);
  float currentOccupied = occupied(current);

  vec2 uvN = clamp(uv + vec2(0.0, -texel.y), vec2(0.0), vec2(1.0));
  vec2 uvS = clamp(uv + vec2(0.0, texel.y), vec2(0.0), vec2(1.0));
  vec2 uvW = clamp(uv + vec2(-texel.x, 0.0), vec2(0.0), vec2(1.0));
  vec2 uvE = clamp(uv + vec2(texel.x, 0.0), vec2(0.0), vec2(1.0));

  vec4 north = texture(uBoardTex, uvN);
  vec4 south = texture(uBoardTex, uvS);
  vec4 west = texture(uBoardTex, uvW);
  vec4 east = texture(uBoardTex, uvE);

  float northInBounds = step(texel.y, uv.y);
  float southInBounds = step(uv.y, 1.0 - texel.y);
  float westInBounds = step(texel.x, uv.x);
  float eastInBounds = step(uv.x, 1.0 - texel.x);

  float northNeedsBorder = max(
    1.0 - northInBounds,
    max(1.0 - occupied(north), colorMismatch(current.rgb, north.rgb))
  );
  float southNeedsBorder = max(
    1.0 - southInBounds,
    max(1.0 - occupied(south), colorMismatch(current.rgb, south.rgb))
  );
  float westNeedsBorder = max(
    1.0 - westInBounds,
    max(1.0 - occupied(west), colorMismatch(current.rgb, west.rgb))
  );
  float eastNeedsBorder = max(
    1.0 - eastInBounds,
    max(1.0 - occupied(east), colorMismatch(current.rgb, east.rgb))
  );

  float huge = 2.0;
  float dTop = cellLocal.y;
  float dBottom = 1.0 - cellLocal.y;
  float dLeft = cellLocal.x;
  float dRight = 1.0 - cellLocal.x;

  float nearestBoundary = min(
    min(mix(huge, dTop, northNeedsBorder), mix(huge, dBottom, southNeedsBorder)),
    min(mix(huge, dLeft, westNeedsBorder), mix(huge, dRight, eastNeedsBorder))
  );

  float aa = 0.01;
  float borderMask = 1.0 - smoothstep(uLineThickness - aa, uLineThickness + aa, nearestBoundary);
  vec4 occupiedColor = mix(current, uBorderColor, borderMask);

  finalColor = mix(uBgColor, occupiedColor, currentOccupied);
}
`;

export function createMondrianFilter(boardTextureSource: object): Filter {
  return Filter.from({
    gl: {
      vertex: FILTER_VERTEX_SOURCE,
      fragment: FILTER_FRAGMENT_SOURCE,
      name: 'mondrian-basic-filter',
    },
    resources: {
      uBoardTex: boardTextureSource,
      mondrianUniforms: {
        uBoardSize: { value: new Float32Array([10, 20]), type: 'vec2<f32>' },
        uLineThickness: { value: 0.08, type: 'f32' },
        uBorderColor: {
          value: new Float32Array([0.067, 0.067, 0.067, 1.0]),
          type: 'vec4<f32>',
        },
        uBgColor: {
          value: new Float32Array([0.94, 0.94, 0.94, 1.0]),
          type: 'vec4<f32>',
        },
      },
    },
  });
}
