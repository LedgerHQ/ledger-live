/**
 * The glow shader in GLSL ES 1.00 (WebGL 1, OpenGL ES 2.0). Source of truth:
 * shaders/glow.metal.ts is a port of it.
 *
 * Based on the designer's "Final Glow Sequence" playground, trimmed to the
 * design rules: dark background, a glow keeps its height and only moves
 * side to side (no travel, no up/down drift, no breathing). Two glows, one at
 * the top and one at the bottom, each with its own fade.
 *
 * One string for both stages: the renderer prepends `#define VERTEX` or
 * `#define FRAGMENT`. The 4 lobe centers are the same for every pixel, so the
 * vertex stage computes them.
 *
 * Uniforms: uRes (drawable px), uTime (seconds),
 * uDpr (pixels per point, capped at 2), uFade (0..1, entry fade),
 * uFadeTop / uFadeBottom (0..1, each glow; 0 skips it), uP (GLOW_PARAM_ORDER; 16 slots, room to grow).
 */
export const GLOW_GLSL = /* glsl */ `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uDpr;
uniform float uFade;
uniform float uFadeTop;
uniform float uFadeBottom;
// 16 params packed in 4 vec4: GLES2 only guarantees 16 uniform vectors per fragment shader.
uniform vec4  uP[4];

#define P_INTENSITY   uP[0].x
#define P_OPACITY     uP[0].y
#define P_GRAIN       uP[0].z
#define P_GRAIN_SIZE  uP[0].w
#define P_CHROMA      uP[1].x
#define P_SOFTNESS    uP[1].y
#define P_WIDTH       uP[1].z
#define P_REACH       uP[1].w
#define P_DARK        uP[2].x
#define P_SPREAD_X    uP[2].y
#define P_BALANCE     uP[2].z
#define P_CONTRAST    uP[2].w
#define P_TOP_REACH   uP[3].x // reach multiplier of the top glow

varying vec2 vCenterA;
varying vec2 vCenterB;
varying vec2 vCenterC;
varying vec2 vCenterD;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

#ifdef VERTEX

attribute vec2 aPos;

// from / to = (x, y, side drift) for balance 0 and balance 1.
vec2 lobeCenter(float seed, vec3 from, vec3 to) {
  vec3 l = mix(from, to, P_BALANCE);
  return vec2(l.x + l.z * snoise(vec2(seed, uTime * 0.019)), l.y);
}

void main() {
  vCenterA = lobeCenter(1.7,  vec3(0.44, 0.03,  0.075), vec3(0.40, 0.04,  0.072));
  vCenterB = lobeCenter(23.4, vec3(0.20, 0.06,  0.09),  vec3(0.24, 0.048, 0.078));
  vCenterC = lobeCenter(41.9, vec3(0.74, 0.02,  0.065), vec3(0.76, 0.048, 0.078));
  vCenterD = lobeCenter(57.2, vec3(0.52, 0.125, 0.11),  vec3(0.60, 0.04,  0.072));
  gl_Position = vec4(aPos, 0.0, 1.0);
}

#endif

#ifdef FRAGMENT

const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p = ROT * p * 2.07;
    amp *= 0.5;
  }
  return sum;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float filmGrain(vec2 px, float t, float size) {
  float n1 = snoise(px / (1.75 * size));
  float n2 = snoise(px / (3.60 * size) + 31.0);
  float n3 = snoise(px / (8.20 * size) + 73.0);
  float fixedPart = n1 * 0.52 + n2 * 0.33 + n3 * 0.21;
  float ph = t * 2.2;
  float f = smoothstep(0.0, 1.0, fract(ph));
  float a = snoise(px / (1.95 * size) + vec2(floor(ph) * 17.0, 0.0));
  float b = snoise(px / (1.95 * size) + vec2((floor(ph) + 1.0) * 17.0, 0.0));
  float g = fixedPart * 0.80 + mix(a, b, f) * 0.26;
  return sign(g) * pow(abs(g), 0.78);
}

float lobe(vec2 p, vec2 c, vec2 rad, float k) {
  vec2 e = (p - c) / max(rad, vec2(0.02));
  return exp(-dot(e, e) * k);
}

// One glow growing from the edge where h = 0 (h: distance from that edge, 0..1).
vec3 glowColor(vec2 uv, float h, vec2 px, float t, float reachScale) {
  vec2 p = vec2(0.5 + (uv.x - 0.5) * max(P_SPREAD_X, 0.2), h);
  vec2 warp = vec2(
    snoise(vec2(p.x * 1.5, p.y * 1.05) + vec2( t * 0.021, -t * 0.014)),
    snoise(vec2(p.x * 1.2, p.y * 0.85) + vec2(-t * 0.017,  t * 0.023))
  );
  p.x += warp.x * 0.105 * smoothstep(0.0, 0.55, h) * P_SOFTNESS;
  float W = max(P_WIDTH, 0.08);
  float R = max(P_REACH * reachScale, 0.06);
  float k = 1.55 / max(P_SOFTNESS, 0.35);
  float b = P_BALANCE;
  float gA = lobe(p, vCenterA, vec2(mix(0.80, 0.72, b) * W, mix(1.00, 0.98, b) * R), k) * mix(0.74, 0.72, b);
  float gB = lobe(p, vCenterB, vec2(mix(0.58, 0.66, b) * W, mix(0.78, 0.88, b) * R), k) * mix(0.76, 0.70, b);
  float gC = lobe(p, vCenterC, vec2(mix(0.46, 0.66, b) * W, mix(0.50, 0.88, b) * R), k) * mix(0.85, 0.72, b);
  float gD = lobe(p, vCenterD, vec2(mix(0.86, 0.72, b) * W, mix(1.30, 1.02, b) * R), k) * mix(0.50, 0.68, b);
  vec3 colA = vec3(0.430, 0.225, 0.870);
  vec3 colB = vec3(0.860, 0.290, 0.640);
  vec3 colC = vec3(1.000, 0.620, 0.310);
  vec3 colD = vec3(0.290, 0.540, 0.960);
  vec4 w = vec4(gA, gB, gC, gD);
  w *= w;
  float wSum = w.x + w.y + w.z + w.w;
  vec3 mixed = (colA * w.x + colB * w.y + colC * w.z + colD * w.w) / max(wSum, 1e-5);
  vec3 tint = mix(colA, mixed, P_CHROMA);
  float cl = fbm(vec2(p.x * 1.35, p.y * 1.05) + warp * 0.40 + vec2(t * 0.010, 0.0)) * 0.5 + 0.5;
  float field = (gA + gB + gC + gD) * 0.78 * (0.80 + mix(0.38, 0.26, b) * cl);
  float v = clamp(field * 0.90, 0.0, 1.6);
  v = pow(v, 1.0 + 1.70 * P_DARK);
  v = pow(v, 1.0 + 0.80 * P_CONTRAST) * (1.0 + 0.60 * P_CONTRAST);
  v *= smoothstep(0.0, 0.045 + 0.10 * P_DARK, v);
  vec3 deep = tint * vec3(0.80, 0.70, 1.00);
  vec3 lift = mix(tint, vec3(0.84, 0.76, 1.00), 0.24);
  tint = mix(tint, mix(deep, lift, smoothstep(0.06, 0.80, v)), P_CONTRAST);
  float gr = filmGrain(px, t, max(P_GRAIN_SIZE, 0.3));
  float mids = smoothstep(0.015, 0.22, v) * (1.0 - 0.70 * smoothstep(0.38, 1.0, v));
  float dens = 0.085 + 0.915 * mids;
  v *= 1.0 + gr * dens * P_GRAIN * 0.34;
  float mottle = snoise(px / 88.0) * 0.6 + snoise(px / 34.0) * 0.4;
  v = max(v * (1.0 + mottle * P_GRAIN * 0.055), 0.0);
  vec3 col = tint * v;
  col += vec3(0.90, 0.86, 1.00) * pow(max(v - 0.72, 0.0), 1.7) * 0.30;
  col *= P_INTENSITY;
  col = col / (1.0 + col * 0.42);
  col += gr * dens * P_GRAIN * 0.030 * vec3(1.0, 0.982, 0.955);
  col *= P_OPACITY;
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;
  vec2 px = gl_FragCoord.xy / max(uDpr, 1.0);
  float t = uTime;
  vec3 col = vec3(0.0);
  // A hidden glow costs nothing: its branch is skipped (uniform branch, same for every pixel).
  if (uFadeTop > 0.0) col += glowColor(uv, uv.y, px, t, P_TOP_REACH) * smoothstep(0.0, 1.0, uFadeTop);
  if (uFadeBottom > 0.0) col += glowColor(uv, 1.0 - uv.y, px, t, 1.0) * smoothstep(0.0, 1.0, uFadeBottom);
  col += (hash21(gl_FragCoord.xy * 0.39) - 0.5) * 0.009;
  col *= uFade;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}

#endif
`;
