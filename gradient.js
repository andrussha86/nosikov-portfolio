// Чистый живой градиент: плоский WebGL-шейдер без 3D-формы, света и зерна —
// только медленный перелив цветов (domain-warped noise). Без зависимостей.
// Без WebGL остаётся CSS-подложка .sg из style.css. При prefers-reduced-motion — статичный кадр.

const still = matchMedia("(prefers-reduced-motion: reduce)");
const theme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";

// base + три пятна. Самый светлый цвет в «night» ограничен, чтобы белый текст сохранял контраст ≥ 7:1.
const palettes = {
  hero: {
    dark:  ["#13152a", "#2c3372", "#46376c", "#1d2c5e"],
    light: ["#edeff6", "#c7cdf2", "#ffd8c9", "#dfe3f8"],
  },
  night: {
    dark:  ["#0b0d1d", "#222762", "#353d84", "#17193d"],
    light: ["#0b0d1d", "#222762", "#353d84", "#17193d"],
  },
};

const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const frag = `
precision highp float;
uniform vec2 res; uniform float t;
uniform vec3 c0, c1, c2, c3;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 2; i++){ v += a*noise(p); p *= 2.02; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res; vec2 p = uv * vec2(res.x/res.y, 1.) * .9;
  vec2 q = vec2(fbm(p + t*.05), fbm(p + vec2(5.2, 1.3) - t*.04));
  vec2 r = vec2(fbm(p + 2.*q + vec2(1.7, 9.2) + t*.03), fbm(p + 2.*q + vec2(8.3, 2.8) - t*.035));
  vec3 col = c0;
  col = mix(col, c1, smoothstep(.22, .62, fbm(p + 1.6*r)));
  col = mix(col, c2, smoothstep(.32, .68, r.x) * .85);
  col = mix(col, c3, smoothstep(.3, .66, q.y) * .6);
  col += (hash(gl_FragCoord.xy + t) - .5) / 255.;   // против полос (banding), зерна не видно
  gl_FragColor = vec4(col, 1.);
}`;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

function mount(el, palette) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);

  const setColors = () => palette[theme()].forEach((hex, i) => gl.uniform3fv(u("c" + i), rgb(hex)));
  const resize = () => {
    const k = 0.5;   // градиент мягкий — половины разрешения достаточно
    canvas.width = Math.max(1, Math.round(el.clientWidth * k));
    canvas.height = Math.max(1, Math.round(el.clientHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u("res"), canvas.width, canvas.height);
  };

  let visible = false, raf = 0;
  const t0 = performance.now(), seed = Math.random() * 100;
  const draw = (now) => {
    gl.uniform1f(u("t"), seed + (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !still.matches) raf = requestAnimationFrame(draw);
  };
  const kick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };

  setColors(); resize();
  el.appendChild(canvas);
  new ResizeObserver(() => { resize(); kick(); }).observe(el);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(el);
  document.addEventListener("themechange", () => { setColors(); kick(); });
  still.addEventListener("change", kick);
  requestAnimationFrame(() => el.classList.add("is-live"));
}

document.querySelectorAll("[data-gradient]").forEach((el) => {
  const palette = palettes[el.dataset.gradient];
  if (palette) mount(el, palette);
});
