/* ==========================================================
   Particles — 첫 화면 배경 입자 효과 (WebGL2)
   붙여 주신 React 컴포넌트(Particles.jsx)를 React 없이 동작하도록
   일반 JavaScript로 옮긴 파일입니다. 렌더링 방식과 옵션 이름은 원본과 같습니다.
   사용: JinwoongParticles.mount(요소, { 옵션 })
   WebGL2를 지원하지 않는 브라우저에서는 아무것도 그리지 않고 null을 돌려줍니다.
   ========================================================== */
(function () {
  'use strict';

  var SHAPES = { circle: 0, square: 1, ring: 2, sparkle: 3 };
  var EFFECTS = { parallax: 0, repel: 1, attract: 2 };
  var DRIFTS = { none: 0, up: 1, down: 2, forward: 3 };
  var MAX_COUNT = 20000;
  var MAX_LINKED = 900;
  var MAX_LINES = 9000;
  var MAX_BURSTS = 4;
  var DEPTH = 10;
  var FOCAL = 1 / Math.tan((7.5 * Math.PI) / 180);
  var NEAR = 0.1;
  var FAR = 100;
  var INTRO_SECONDS = 1.8;
  var BURST_SECONDS = 1.5;
  var BURST_SPEED = 520;
  var BURST_WIDTH = 46;

  var PARTICLE_VERTEX = '#version 300 es\n' +
'precision highp float;\n' +
'layout(location = 0) in vec2 aCorner;\n' +
'layout(location = 1) in vec3 aPosition;\n' +
'layout(location = 2) in vec4 aRandom;\n' +
'layout(location = 3) in vec3 aColor;\n' +
'uniform mat3 uRotation;\n' +
'uniform vec3 uOffset;\n' +
'uniform float uSpread;\n' +
'uniform float uTime;\n' +
'uniform float uCamera;\n' +
'uniform float uAspect;\n' +
'uniform vec2 uView;\n' +
'uniform float uRatio;\n' +
'uniform float uSize;\n' +
'uniform float uRandomness;\n' +
'uniform float uBlur;\n' +
'uniform float uFocus;\n' +
'uniform float uGlow;\n' +
'uniform float uTwinkle;\n' +
'uniform int uShape;\n' +
'uniform int uDrift;\n' +
'uniform float uTravel;\n' +
'uniform vec4 uPointer;\n' +
'uniform int uEffect;\n' +
'uniform float uStrength;\n' +
'uniform vec4 uBursts[' + MAX_BURSTS + '];\n' +
'uniform int uBurstCount;\n' +
'uniform float uReveal;\n' +
'out vec2 vLocal;\n' +
'out float vRadius;\n' +
'out float vBlur;\n' +
'out float vAlpha;\n' +
'out float vHalo;\n' +
'out float vSeed;\n' +
'out vec3 vColor;\n' +
'vec3 bob(vec4 r, float t) {\n' +
'  return vec3(\n' +
'    sin(t * r.z + 6.28 * r.w) * mix(0.1, 1.5, r.x),\n' +
'    sin(t * r.y + 6.28 * r.x) * mix(0.1, 1.5, r.w),\n' +
'    sin(t * r.w + 6.28 * r.y) * mix(0.1, 1.5, r.z)\n' +
'  );\n' +
'}\n' +
'void main() {\n' +
'  vec3 pos = aPosition * uSpread;\n' +
'  pos.z *= ' + DEPTH.toFixed(1) + ';\n' +
'  vec3 wobble = bob(aRandom, uTime);\n' +
'  vec3 world = uRotation * pos + uOffset + wobble;\n' +
'  float edge = 1.0;\n' +
'  if (uDrift == 1 || uDrift == 2) {\n' +
'    float span = uSpread * 2.0 + 3.0;\n' +
'    float k = mod(aRandom.w * span + uOffset.y + wobble.y + (uDrift == 1 ? uTravel : -uTravel), span);\n' +
'    world.y = k - span * 0.5;\n' +
'    edge = smoothstep(0.0, span * 0.12, k) * smoothstep(span, span * 0.88, k);\n' +
'  } else if (uDrift == 3) {\n' +
'    float span = uSpread * ' + DEPTH.toFixed(1) + ' * 2.0 + 3.0;\n' +
'    float k = mod(aRandom.y * span + uOffset.z + wobble.z + uTravel, span);\n' +
'    world.z = k - span * 0.5;\n' +
'    edge = smoothstep(0.0, span * 0.1, k);\n' +
'  }\n' +
'  vec3 view = world - vec3(0.0, 0.0, uCamera);\n' +
'  float dist = length(view);\n' +
'  float ahead = -view.z;\n' +
'  if (ahead < ' + NEAR.toFixed(2) + ' || ahead > ' + FAR.toFixed(1) + ') {\n' +
'    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n' +
'    return;\n' +
'  }\n' +
'  edge *= smoothstep(1.0, 4.0, ahead);\n' +
'  vec2 ndc = vec2(view.x * ' + FOCAL.toFixed(6) + ' / uAspect, view.y * ' + FOCAL.toFixed(6) + ') / ahead;\n' +
'  vec2 screen = (ndc * 0.5 + 0.5) * uView;\n' +
'  vec2 shift = vec2(0.0);\n' +
'  float flash = 0.0;\n' +
'  if (uEffect != 0 && uPointer.z > 0.001) {\n' +
'    vec2 delta = screen - uPointer.xy;\n' +
'    float reach = length(delta);\n' +
'    float falloff = exp(-dot(delta, delta) / (uPointer.w * uPointer.w));\n' +
'    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);\n' +
'    shift += (uEffect == 1 ? away * uPointer.w * 0.5 : -delta * 0.6) * falloff * uStrength * uPointer.z;\n' +
'  }\n' +
'  for (int i = 0; i < ' + MAX_BURSTS + '; i++) {\n' +
'    if (i >= uBurstCount) break;\n' +
'    vec4 burst = uBursts[i];\n' +
'    vec2 delta = screen - burst.xy;\n' +
'    float reach = length(delta);\n' +
'    float wave = exp(-pow((reach - burst.z * ' + BURST_SPEED.toFixed(1) + ') / ' + BURST_WIDTH.toFixed(1) + ', 2.0));\n' +
'    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);\n' +
'    float fade = (1.0 - burst.z) * (1.0 - burst.z) * burst.w;\n' +
'    shift += away * wave * fade * 56.0 * smoothstep(0.0, 30.0, reach);\n' +
'    flash += wave * fade;\n' +
'  }\n' +
'  screen += shift;\n' +
'  float diameter = (uRandomness <= 0.0 ? uSize : uSize * (1.0 + uRandomness * (aRandom.x - 0.5)) / dist) * (1.0 + min(flash, 1.0) * 0.6);\n' +
'  float device = diameter * uRatio;\n' +
'  float radius = max(diameter, 1.0 / uRatio) * 0.5;\n' +
'  float coverage = min(1.0, device * device);\n' +
'  float blur = uBlur * max(uFocus - dist, 0.0) / max(dist, 1.0);\n' +
'  float halo = uGlow > 0.0 ? radius * 2.5 + 2.0 : 0.0;\n' +
'  float extent = radius * (uShape == 3 ? 1.6 : 1.0) + blur + halo + 1.5;\n' +
'  float twinkle = 1.0 - uTwinkle * 0.6 * (0.5 + 0.5 * sin(uTime * (6.0 + aRandom.y * 14.0) + aRandom.w * 40.0));\n' +
'  float far = smoothstep(' + FAR.toFixed(1) + ', ' + (FAR * 0.9).toFixed(1) + ', ahead);\n' +
'  float focus = radius / (radius + blur);\n' +
'  float reveal = clamp(uReveal * 1.6 - aRandom.z * 0.6, 0.0, 1.0);\n' +
'  vLocal = aCorner * extent;\n' +
'  vRadius = radius;\n' +
'  vBlur = blur;\n' +
'  vHalo = halo;\n' +
'  vSeed = aRandom.y;\n' +
'  vAlpha = min(1.0, coverage * twinkle * (1.0 + flash * 1.4)) * far * edge * max(focus, 0.35) * reveal * reveal;\n' +
'  vColor = aColor;\n' +
'  gl_Position = vec4((screen + aCorner * extent) / uView * 2.0 - 1.0, 0.0, 1.0);\n' +
'}';

  var PARTICLE_FRAGMENT = '#version 300 es\n' +
'precision highp float;\n' +
'precision highp int;\n' +
'uniform int uShape;\n' +
'uniform float uGlow;\n' +
'uniform float uRatio;\n' +
'uniform float uTime;\n' +
'uniform float uSoft;\n' +
'uniform float uShimmer;\n' +
'uniform float uOpacity;\n' +
'in vec2 vLocal;\n' +
'in float vRadius;\n' +
'in float vBlur;\n' +
'in float vAlpha;\n' +
'in float vHalo;\n' +
'in float vSeed;\n' +
'in vec3 vColor;\n' +
'out vec4 outColor;\n' +
'float ray(vec2 q, float aa) {\n' +
'  float width = 0.14 * max(0.0, 1.0 - q.x);\n' +
'  return (1.0 - smoothstep(width - aa, width + aa, q.y)) * step(q.x, 1.0);\n' +
'}\n' +
'void main() {\n' +
'  float soft = vBlur + 0.7 / uRatio + vRadius * uSoft;\n' +
'  float d = length(vLocal);\n' +
'  float shape;\n' +
'  if (uShape == 1) {\n' +
'    float box = max(abs(vLocal.x), abs(vLocal.y));\n' +
'    shape = 1.0 - smoothstep(vRadius * 0.86 - soft, vRadius * 0.86 + soft, box);\n' +
'  } else if (uShape == 2) {\n' +
'    float edge = max(vRadius * 0.22, 0.6 / uRatio);\n' +
'    shape = 1.0 - smoothstep(edge - soft, edge + soft, abs(d - vRadius * 0.8));\n' +
'  } else if (uShape == 3) {\n' +
'    float reach = vRadius * 1.6;\n' +
'    vec2 q = abs(vLocal) / max(reach, 0.0001);\n' +
'    float aa = soft / max(reach, 0.0001);\n' +
'    shape = max(max(ray(q, aa), ray(q.yx, aa)), 1.0 - smoothstep(vRadius * 0.32 - soft, vRadius * 0.32 + soft, d));\n' +
'  } else {\n' +
'    shape = 1.0 - smoothstep(vRadius - soft, vRadius + soft, d);\n' +
'  }\n' +
'  float halo = vHalo > 0.0 ? exp(-d / (vHalo * 0.35)) * uGlow * 0.4 : 0.0;\n' +
'  float alpha = clamp(shape + halo * (1.0 - shape), 0.0, 1.0) * vAlpha * uOpacity * (1.0 - uSoft);\n' +
'  if (alpha < 0.002) discard;\n' +
'  vec2 uv = vLocal / max(vRadius * 2.0, 0.0001) + 0.5;\n' +
'  vec3 color = clamp(vColor + uShimmer * 0.2 * sin(uv.yxx + uTime + vSeed * 6.28), 0.0, 1.0);\n' +
'  outColor = vec4(color * alpha, alpha);\n' +
'}';

  var LINE_VERTEX = '#version 300 es\n' +
'precision highp float;\n' +
'layout(location = 0) in vec2 aCorner;\n' +
'layout(location = 1) in vec4 aEnds;\n' +
'layout(location = 2) in vec4 aTint;\n' +
'uniform vec2 uView;\n' +
'uniform float uRatio;\n' +
'uniform float uWidth;\n' +
'out float vAcross;\n' +
'out float vHalf;\n' +
'out vec4 vTint;\n' +
'void main() {\n' +
'  vec2 a = aEnds.xy;\n' +
'  vec2 b = aEnds.zw;\n' +
'  vec2 along = b - a;\n' +
'  float span = max(length(along), 0.0001);\n' +
'  vec2 normal = vec2(-along.y, along.x) / span;\n' +
'  float reach = uWidth * 0.5 + 1.0 / uRatio;\n' +
'  vec2 point = mix(a, b, aCorner.x * 0.5 + 0.5) + normal * aCorner.y * reach;\n' +
'  vAcross = aCorner.y * reach;\n' +
'  vHalf = uWidth * 0.5;\n' +
'  vTint = aTint;\n' +
'  gl_Position = vec4(point / uView * 2.0 - 1.0, 0.0, 1.0);\n' +
'}';

  var LINE_FRAGMENT = '#version 300 es\n' +
'precision highp float;\n' +
'uniform float uRatio;\n' +
'uniform float uOpacity;\n' +
'in float vAcross;\n' +
'in float vHalf;\n' +
'in vec4 vTint;\n' +
'out vec4 outColor;\n' +
'void main() {\n' +
'  float edge = 0.6 / uRatio;\n' +
'  float cover = 1.0 - smoothstep(vHalf - edge, vHalf + edge, abs(vAcross));\n' +
'  float alpha = cover * vTint.a * uOpacity;\n' +
'  outColor = vec4(vTint.rgb * alpha, alpha);\n' +
'}';

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  function link(gl, vertexSource, fragmentSource) {
    var vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    var uniforms = {};
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
    }
    return { program: program, uniforms: uniforms };
  }

  function seeded(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
  function wrap(value, span) { return ((value % span) + span) % span; }

  /* 원본 컴포넌트의 기본값과 같습니다 */
  function buildSettings(o) {
    o = o || {};
    var pick = function (k, d) { return o[k] === undefined ? d : o[k]; };
    var colors = pick('particleColors', ['#ffffff']);
    var palette = (Array.isArray(colors) ? colors : [colors]).filter(Boolean).map(String);
    return {
      count: clamp(Math.round(pick('particleCount', 200)), 1, MAX_COUNT),
      spread: Math.max(0.1, pick('particleSpread', 10)),
      speed: pick('speed', 0.1),
      colors: palette.length ? palette : ['#ffffff'],
      mouse: pick('moveParticlesOnHover', true),
      hoverFactor: Math.max(0, pick('particleHoverFactor', 1)),
      soft: pick('alphaParticles', false),
      size: Math.max(0, pick('particleBaseSize', 100)),
      randomness: Math.max(0, pick('sizeRandomness', 1)),
      camera: Math.max(1, pick('cameraDistance', 20)),
      rotate: !pick('disableRotation', false),
      dpr: pick('pixelRatio', undefined),
      shape: SHAPES[pick('shape', 'circle')] || 0,
      glow: Math.max(0, pick('glow', 0.5)),
      twinkle: clamp(pick('twinkle', 0.3), 0, 1),
      depthOfField: Math.max(0, pick('depthOfField', 0)),
      connections: pick('connections', false),
      connectionDistance: Math.max(10, pick('connectionDistance', 110)),
      hoverEffect: EFFECTS[pick('hoverEffect', 'parallax')] || 0,
      hoverRadius: Math.max(20, pick('hoverRadius', 140)),
      clickBurst: pick('clickBurst', true),
      drift: DRIFTS[pick('drift', 'none')] || 0,
      driftSpeed: pick('driftSpeed', 1),
      variation: Math.max(0, Math.round(pick('variation', 0))),
      intro: pick('intro', true),
      opacity: clamp(pick('opacity', 1), 0, 1),
      lightMode: pick('lightMode', false),
      paused: pick('paused', false)
    };
  }

  function mount(container, options) {
    if (!container) return null;
    var s = buildSettings(options);
    var canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return null;

    var dots = link(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT);
    var lines = link(gl, LINE_VERTEX, LINE_FRAGMENT);
    if (!dots || !lines) return null;
    container.appendChild(canvas);

    var corners = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    var positionBuffer = gl.createBuffer();
    var randomBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();
    var dotVao = gl.createVertexArray();
    gl.bindVertexArray(dotVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var attach = function (buffer, location, width) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, width, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(location, 1);
    };
    attach(positionBuffer, 1, 3);
    attach(randomBuffer, 2, 4);
    attach(colorBuffer, 3, 3);

    var lineBuffer = gl.createBuffer();
    var lineData = new Float32Array(MAX_LINES * 8);
    var lineVao = gl.createVertexArray();
    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);

    var probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    var cache = new Map();
    var parse = function (value) {
      if (cache.has(value)) return cache.get(value);
      var rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        var d = probe.getImageData(0, 0, 1, 1).data;
        rgb = [d[0] / 255, d[1] / 255, d[2] / 255];
      }
      cache.set(value, rgb);
      return rgb;
    };
    var ink = function (rgb) {
      var linear = rgb.map(function (v) { return Math.pow(v, 2.2); });
      var tone = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      var depth = Math.min(1, 0.06 / Math.max(tone, 0.0001));
      return linear.map(function (v) { return Math.pow(v * depth, 1 / 2.2); });
    };

    var view = { width: 1, height: 1, ratio: 1 };
    var pointer = { x: 0, y: 0, sx: 0, sy: 0, nx: 0, ny: 0, inside: false, active: 0 };
    var state = { clock: 0, spin: 0, travel: 0, offsetX: 0, offsetY: 0, reveal: s.intro && !reduce ? 0 : 1 };
    var bursts = [];
    var packedBursts = new Float32Array(MAX_BURSTS * 4);
    var cloud = { key: '', count: 0, positions: new Float32Array(0), randoms: new Float32Array(0), colors: new Float32Array(0) };
    var screen = { x: new Float32Array(0), y: new Float32Array(0), ahead: new Float32Array(0), alpha: new Float32Array(0) };
    var raf = 0;
    var last = 0;
    var visible = true;

    var rebuild = function () {
      var key = s.count + '|' + s.variation + '|' + s.colors.join(',') + '|' + (s.lightMode ? 1 : 0);
      if (key === cloud.key) return;
      cloud.key = key;
      var next = seeded(s.variation * 7919 + 1);
      var total = s.count;
      var positions = new Float32Array(total * 3);
      var randoms = new Float32Array(total * 4);
      var tints = new Float32Array(total * 3);
      var swatches = s.colors.map(function (value) { return s.lightMode ? ink(parse(value)) : parse(value); });
      for (var i = 0; i < total; i++) {
        var x, y, z, len;
        do {
          x = next() * 2 - 1;
          y = next() * 2 - 1;
          z = next() * 2 - 1;
          len = x * x + y * y + z * z;
        } while (len > 1 || len === 0);
        var r = Math.cbrt(next());
        positions.set([x * r, y * r, z * r], i * 3);
        randoms.set([next(), next(), next(), next()], i * 4);
        tints.set(swatches[Math.floor(next() * swatches.length)], i * 3);
      }
      cloud.count = total;
      cloud.positions = positions;
      cloud.randoms = randoms;
      cloud.colors = tints;
      var linked = Math.min(total, MAX_LINKED);
      screen.x = new Float32Array(linked);
      screen.y = new Float32Array(linked);
      screen.ahead = new Float32Array(linked);
      screen.alpha = new Float32Array(linked);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, tints, gl.STATIC_DRAW);
    };

    var rotationOf = function () {
      var elapsed = state.clock * 1000;
      var x = s.rotate ? Math.sin(elapsed * 0.0002) * 0.1 : 0;
      var y = s.rotate ? Math.cos(elapsed * 0.0005) * 0.15 : 0;
      var z = s.rotate ? state.spin : 0;
      var sx = Math.sin(x), cx = Math.cos(x), sy = Math.sin(y), cy = Math.cos(y), sz = Math.sin(z), cz = Math.cos(z);
      return [
        cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz,
        -cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz,
        sy * cx, -sx, cy * cx
      ];
    };

    var offsetOf = function () { return [state.offsetX, state.offsetY, -(1 - easeOut(state.reveal)) * 70]; };

    var project = function (matrix) {
      var total = Math.min(cloud.count, MAX_LINKED);
      var off = offsetOf(), ox = off[0], oy = off[1], oz = off[2];
      var aspect = view.width / view.height;
      var time = state.clock;
      var radius = s.hoverRadius;
      var active = s.hoverEffect !== 0 ? pointer.active : 0;
      var spanY = s.spread * 2 + 3;
      var spanZ = s.spread * DEPTH * 2 + 3;
      for (var i = 0; i < total; i++) {
        var px = cloud.positions[i * 3] * s.spread;
        var py = cloud.positions[i * 3 + 1] * s.spread;
        var pz = cloud.positions[i * 3 + 2] * s.spread * DEPTH;
        var r0 = cloud.randoms[i * 4], r1 = cloud.randoms[i * 4 + 1], r2 = cloud.randoms[i * 4 + 2], r3 = cloud.randoms[i * 4 + 3];
        var bobX = Math.sin(time * r2 + 6.28 * r3) * (0.1 + 1.4 * r0);
        var bobY = Math.sin(time * r1 + 6.28 * r0) * (0.1 + 1.4 * r3);
        var bobZ = Math.sin(time * r3 + 6.28 * r1) * (0.1 + 1.4 * r2);
        var wx = matrix[0] * px + matrix[3] * py + matrix[6] * pz + ox + bobX;
        var wy = matrix[1] * px + matrix[4] * py + matrix[7] * pz + oy + bobY;
        var wz = matrix[2] * px + matrix[5] * py + matrix[8] * pz + oz + bobZ;
        var edge = 1;
        if (s.drift === 1 || s.drift === 2) {
          var k = wrap(r3 * spanY + oy + bobY + (s.drift === 1 ? state.travel : -state.travel), spanY);
          wy = k - spanY / 2;
          var low = clamp(k / (spanY * 0.12), 0, 1);
          var high = clamp((spanY - k) / (spanY * 0.12), 0, 1);
          edge = low * low * (3 - 2 * low) * high * high * (3 - 2 * high);
        } else if (s.drift === 3) {
          var k2 = wrap(r1 * spanZ + oz + bobZ + state.travel, spanZ);
          wz = k2 - spanZ / 2;
          var fresh = clamp(k2 / (spanZ * 0.1), 0, 1);
          edge = fresh * fresh * (3 - 2 * fresh);
        }
        var ahead = s.camera - wz;
        if (ahead < NEAR || ahead > FAR) { screen.alpha[i] = 0; continue; }
        var close = clamp((ahead - 1) / 3, 0, 1);
        edge *= close * close * (3 - 2 * close);
        var sx = ((wx * FOCAL) / aspect / ahead) * 0.5 * view.width + view.width / 2;
        var sy = ((wy * FOCAL) / ahead) * 0.5 * view.height + view.height / 2;
        var dx = 0, dy = 0;
        if (active > 0.001) {
          var ex = sx - pointer.sx, ey = sy - pointer.sy;
          var reach = Math.hypot(ex, ey);
          var falloff = Math.exp(-(ex * ex + ey * ey) / (radius * radius)) * s.hoverFactor * active;
          if (s.hoverEffect === 1 && reach > 0.001) {
            dx += (ex / reach) * radius * 0.5 * falloff;
            dy += (ey / reach) * radius * 0.5 * falloff;
          } else if (s.hoverEffect === 2) {
            dx -= ex * 0.6 * falloff;
            dy -= ey * 0.6 * falloff;
          }
        }
        for (var b = 0; b < bursts.length; b++) {
          var burst = bursts[b];
          var progress = burst.age / BURST_SECONDS;
          var bx = sx - burst.x, by = sy - burst.y;
          var breach = Math.hypot(bx, by);
          if (breach < 0.001) continue;
          var wave = Math.exp(-Math.pow((breach - progress * BURST_SPEED) / BURST_WIDTH, 2));
          var ramp = clamp(breach / 30, 0, 1);
          var push = wave * (1 - progress) * (1 - progress) * 56 * ramp * ramp * (3 - 2 * ramp);
          dx += (bx / breach) * push;
          dy += (by / breach) * push;
        }
        sx += dx;
        sy += dy;
        var far = clamp((FAR - ahead) / (FAR - FAR * 0.9), 0, 1);
        var reveal = clamp(state.reveal * 1.6 - r2 * 0.6, 0, 1);
        screen.x[i] = sx;
        screen.y[i] = sy;
        screen.ahead[i] = ahead;
        screen.alpha[i] = far * far * (3 - 2 * far) * edge * reveal * reveal;
      }
      return total;
    };

    var buildLines = function (matrix) {
      var total = project(matrix);
      var reach = s.connectionDistance;
      var columns = Math.max(1, Math.ceil(view.width / reach) + 2);
      var buckets = new Map();
      for (var i = 0; i < total; i++) {
        if (screen.alpha[i] < 0.02) continue;
        var key = (Math.floor(screen.y[i] / reach) + 1) * columns + Math.floor(screen.x[i] / reach) + 1;
        var bucket = buckets.get(key);
        if (bucket) bucket.push(i);
        else buckets.set(key, [i]);
      }
      var lineCount = 0;
      var limit = reach * reach;
      var offsets = [0, 1, columns - 1, columns, columns + 1];
      var full = false;
      buckets.forEach(function (members, bkey) {
        if (full) return;
        for (var o = 0; o < offsets.length; o++) {
          var offset = offsets[o];
          var others = offset === 0 ? members : buckets.get(bkey + offset);
          if (!others) continue;
          for (var a = 0; a < members.length; a++) {
            var ia = members[a];
            for (var bb = offset === 0 ? a + 1 : 0; bb < others.length; bb++) {
              var j = others[bb];
              var ddx = screen.x[ia] - screen.x[j];
              var ddy = screen.y[ia] - screen.y[j];
              var gap = ddx * ddx + ddy * ddy;
              if (gap > limit) continue;
              var layer = clamp(1 - Math.abs(screen.ahead[ia] - screen.ahead[j]) / 18, 0, 1);
              if (layer <= 0) continue;
              if (lineCount >= MAX_LINES) { full = true; return; }
              var fade = 1 - Math.sqrt(gap) / reach;
              var base = lineCount * 8;
              lineData[base] = screen.x[ia];
              lineData[base + 1] = screen.y[ia];
              lineData[base + 2] = screen.x[j];
              lineData[base + 3] = screen.y[j];
              lineData[base + 4] = (cloud.colors[ia * 3] + cloud.colors[j * 3]) / 2;
              lineData[base + 5] = (cloud.colors[ia * 3 + 1] + cloud.colors[j * 3 + 1]) / 2;
              lineData[base + 6] = (cloud.colors[ia * 3 + 2] + cloud.colors[j * 3 + 2]) / 2;
              lineData[base + 7] = fade * fade * layer * 0.7 * Math.min(screen.alpha[ia], screen.alpha[j]);
              lineCount++;
            }
          }
        }
      });
      return lineCount;
    };

    var render = function () {
      rebuild();
      var matrix = rotationOf();
      var off = offsetOf();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      if (s.connections) {
        var lineCount = buildLines(matrix);
        if (lineCount) {
          gl.useProgram(lines.program);
          gl.bindVertexArray(lineVao);
          gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, lineData.subarray(0, lineCount * 8));
          gl.uniform2f(lines.uniforms.uView, view.width, view.height);
          gl.uniform1f(lines.uniforms.uRatio, view.ratio);
          gl.uniform1f(lines.uniforms.uWidth, 1);
          gl.uniform1f(lines.uniforms.uOpacity, s.opacity);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, lineCount);
        }
      }

      var u = dots.uniforms;
      var burstCount = 0;
      for (var i = bursts.length - 1; i >= 0 && burstCount < MAX_BURSTS; i--) {
        packedBursts.set([bursts[i].x, bursts[i].y, bursts[i].age / BURST_SECONDS, 1], burstCount * 4);
        burstCount++;
      }
      gl.useProgram(dots.program);
      gl.bindVertexArray(dotVao);
      gl.uniformMatrix3fv(u.uRotation, false, matrix);
      gl.uniform3f(u.uOffset, off[0], off[1], off[2]);
      gl.uniform1f(u.uSpread, s.spread);
      gl.uniform1f(u.uTime, state.clock);
      gl.uniform1f(u.uCamera, s.camera);
      gl.uniform1f(u.uAspect, view.width / view.height);
      gl.uniform2f(u.uView, view.width, view.height);
      gl.uniform1f(u.uRatio, view.ratio);
      gl.uniform1f(u.uSize, s.size);
      gl.uniform1f(u.uRandomness, s.randomness);
      gl.uniform1f(u.uBlur, s.depthOfField * 14);
      gl.uniform1f(u.uFocus, s.camera + 14);
      gl.uniform1f(u.uGlow, s.lightMode ? s.glow * 0.3 : s.glow);
      gl.uniform1f(u.uTwinkle, s.twinkle);
      gl.uniform1i(u.uShape, s.shape);
      gl.uniform1i(u.uDrift, s.drift);
      gl.uniform1f(u.uTravel, state.travel);
      gl.uniform4f(u.uPointer, pointer.sx, pointer.sy, pointer.active, s.hoverRadius);
      gl.uniform1i(u.uEffect, s.hoverEffect);
      gl.uniform1f(u.uStrength, s.hoverFactor);
      gl.uniform4fv(u.uBursts, packedBursts);
      gl.uniform1i(u.uBurstCount, burstCount);
      gl.uniform1f(u.uReveal, state.reveal);
      gl.uniform1f(u.uSoft, s.soft ? 0.2 : 0);
      gl.uniform1f(u.uShimmer, s.lightMode ? 0 : 1);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cloud.count);
      gl.bindVertexArray(null);
    };

    var frame = function (now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      if (s.paused) { state.reveal = 1; render(); last = 0; return; }
      var motion = reduce ? 0 : 1;
      var pace = dt * s.speed * motion;
      state.clock += pace;
      if (s.rotate) state.spin += pace * 0.6;
      state.travel += dt * s.driftSpeed * motion * (s.drift === 3 ? 6 : 0.9);

      var engaged = s.mouse && pointer.inside && !reduce;
      var follow = 1 - Math.exp(-dt / 0.35);
      var parallax = engaged && s.hoverEffect === 0 ? s.hoverFactor : 0;
      state.offsetX += (-pointer.nx * parallax - state.offsetX) * follow;
      state.offsetY += (-pointer.ny * parallax - state.offsetY) * follow;
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt / 0.06));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt / 0.06));
      pointer.active += ((engaged ? 1 : 0) - pointer.active) * (1 - Math.exp(-dt / 0.2));

      for (var i = bursts.length - 1; i >= 0; i--) {
        bursts[i].age += dt;
        if (bursts[i].age >= BURST_SECONDS) bursts.splice(i, 1);
      }

      if (!s.intro || reduce) state.reveal = 1;
      else if (state.reveal < 1) state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);

      render();
      // 움직임 줄이기 설정이면 한 번만 그리고 멈춤
      if (!reduce || state.reveal < 1 || bursts.length) raf = requestAnimationFrame(frame);
    };

    var wake = function () { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

    var resize = function () {
      var width = Math.max(1, container.clientWidth);
      var height = Math.max(1, container.clientHeight);
      var ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      view.width = width;
      view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.ratio = canvas.width / width;
      render();
      wake();
    };

    var locate = function (event) {
      var rect = container.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var wasInside = pointer.inside;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.x = x;
      pointer.y = rect.height - y;
      pointer.nx = (x / Math.max(1, rect.width)) * 2 - 1;
      pointer.ny = -((y / Math.max(1, rect.height)) * 2 - 1);
      if (pointer.inside && !wasInside) { pointer.sx = pointer.x; pointer.sy = pointer.y; }
    };

    var onPointerMove = function (event) { locate(event); if (!s.paused) wake(); };
    var onPointerDown = function (event) {
      locate(event);
      if (!pointer.inside || !s.clickBurst || s.paused || reduce) return;
      bursts.push({ x: pointer.x, y: pointer.y, age: 0 });
      if (bursts.length > MAX_BURSTS) bursts.shift();
      wake();
    };
    var onPointerUp = function (event) { if (event.pointerType !== 'mouse') pointer.inside = false; };
    var onPointerLeave = function () { pointer.inside = false; };
    var onVisibility = function () { last = 0; wake(); };

    var resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    var intersection = new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) { return entry.isIntersecting; });
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    return function destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(dots.program);
      gl.deleteProgram(lines.program);
      [corners, positionBuffer, randomBuffer, colorBuffer, lineBuffer].forEach(function (buffer) { gl.deleteBuffer(buffer); });
      gl.deleteVertexArray(dotVao);
      gl.deleteVertexArray(lineVao);
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }

  window.JinwoongParticles = { mount: mount };

  /* ---------- 첫 화면에 적용 (수처리 분위기: 떠오르는 물방울) ---------- */
  var target = document.getElementById('hero-particles');
  if (target) {
    var small = window.matchMedia('(max-width: 899px)').matches;
    var destroy = mount(target, {
      particleCount: small ? 90 : 200,      // 휴대폰은 적게
      particleSpread: 10,
      speed: 0.08,
      particleColors: ['#38bdf8', '#0284c7', '#7dd3fc'],
      shape: 'ring',                       // 링 모양 = 기포
      particleBaseSize: small ? 300 : 380,
      sizeRandomness: 1.2,
      glow: 0.25,
      twinkle: 0.15,
      drift: 'up',                         // 위로 천천히 떠오름
      driftSpeed: 0.45,
      hoverEffect: 'repel',                // 마우스를 대면 살짝 비켜남
      hoverRadius: 120,
      particleHoverFactor: 0.6,
      clickBurst: true,                    // 클릭하면 물결처럼 퍼짐
      alphaParticles: true,
      opacity: 0.85,
      disableRotation: true
    });
    if (destroy) {
      var hero = target.closest('.hero');
      if (hero) hero.classList.add('has-particles');
    }
  }
})();
