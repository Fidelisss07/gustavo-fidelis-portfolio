/* A procedural torus knot: indexed geometry, studio reflections, no runtime dependency. */
(() => {
  const canvas = document.querySelector("#sculpture");
  const stage = canvas?.parentElement;
  if (!canvas) return;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!gl) return;
  const vertex = `
    attribute vec3 position; attribute vec3 normal;
    uniform mat4 model; uniform mat4 projection;
    varying vec3 worldPosition; varying vec3 worldNormal;
    void main(){vec4 p=model*vec4(position,1.);worldPosition=p.xyz;worldNormal=mat3(model)*normal;gl_Position=projection*vec4(p.xyz-vec3(0.,0.,5.8),1.);}
  `;
  const fragment = `
    precision mediump float;
    varying vec3 worldPosition; varying vec3 worldNormal;
    vec3 studio(vec3 r){
      vec3 c=vec3(.012,.019,.035);
      float ceiling=smoothstep(.05,.45,r.y);
      c+=vec3(.34,.40,.53)*ceiling;
      float softbox=pow(max(0.,dot(r,normalize(vec3(-.6,1.,1.)))),10.);
      c+=vec3(2.5,2.7,3.0)*softbox;
      float strip=exp(-pow((r.x+.38)*15.,2.))*smoothstep(-.65,-.1,r.y);
      c+=vec3(3.0,3.15,3.4)*strip;
      float edge=pow(max(0.,dot(r,normalize(vec3(1.,.25,-.6)))),7.);
      c+=vec3(.07,.23,1.6)*edge;
      float floorLight=pow(max(0.,dot(r,normalize(vec3(-.3,-1.,.5)))),16.);
      c+=vec3(.03,.17,.9)*floorLight;
      return c;
    }
    void main(){
      vec3 n=normalize(worldNormal); vec3 view=normalize(vec3(0.,0.,5.8)-worldPosition);
      vec3 reflection=reflect(-view,n);
      float fresnel=pow(1.-max(0.,dot(n,view)),3.);
      vec3 col=studio(reflection)*vec3(.82,.87,.98);
      col+=vec3(.024,.035,.075)+fresnel*vec3(.04,.08,.19);
      col=col/(col+vec3(.85)); col=pow(col,vec3(.82));
      gl_FragColor=vec4(col,1.);
    }
  `;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      throw new Error("Shader unavailable");
    }
    return s;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch {
    return;
  }
  const normalize = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((x) => x / l);
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const knot = (u) => {
    const r = 1.0 * (2 + Math.cos(1.5 * u)) * 0.5;
    return [r * Math.cos(u), r * Math.sin(u), 0.5 * Math.sin(1.5 * u)];
  };
  const segments = 220,
    sides = 36,
    positions = [],
    normals = [],
    indices = [];
  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 4,
      p = knot(u),
      next = knot(u + 0.001),
      t = normalize(next.map((x, j) => x - p[j])),
      b = normalize(
        cross(
          t,
          next.map((x, j) => x + p[j]),
        ),
      ),
      n = normalize(cross(b, t));
    for (let j = 0; j <= sides; j++) {
      const v = (j / sides) * Math.PI * 2,
        dir = n.map((x, k) => Math.cos(v) * x + Math.sin(v) * b[k]);
      positions.push(...p.map((x, k) => x + 0.31 * dir[k]));
      normals.push(...dir);
    }
  }
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  gl.useProgram(program);
  for (const [name, data] of [
    ["position", positions],
    ["normal", normals],
  ]) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
  }
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );
  const modelLocation = gl.getUniformLocation(program, "model"),
    projectionLocation = gl.getUniformLocation(program, "projection");
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  const multiply = (a, b) => {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++)
          out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return out;
  };
  const rx = (a) => [
    1,
    0,
    0,
    0,
    0,
    Math.cos(a),
    Math.sin(a),
    0,
    0,
    -Math.sin(a),
    Math.cos(a),
    0,
    0,
    0,
    0,
    1,
  ];
  const ry = (a) => [
    Math.cos(a),
    0,
    -Math.sin(a),
    0,
    0,
    1,
    0,
    0,
    Math.sin(a),
    0,
    Math.cos(a),
    0,
    0,
    0,
    0,
    1,
  ];
  const rz = (a) => [
    Math.cos(a),
    Math.sin(a),
    0,
    0,
    -Math.sin(a),
    Math.cos(a),
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
  let pointerX = 0,
    pointerY = 0,
    currentX = 0,
    currentY = 0,
    visible = true,
    raf = 0,
    last = 0,
    elapsed = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const paused = () =>
    reduced.matches || document.body.classList.contains("motion-paused");
  function resize() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const f = 1 / Math.tan(0.64 / 2),
      aspect = canvas.width / canvas.height,
      near = 0.1,
      far = 100;
    gl.uniformMatrix4fv(
      projectionLocation,
      false,
      new Float32Array([
        f / aspect,
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (far + near) / (near - far),
        -1,
        0,
        0,
        (2 * far * near) / (near - far),
        0,
      ]),
    );
    draw();
  }
  function draw() {
    const moving = !paused();
    const scroll = moving ? Math.min(scrollY / innerHeight, 1) : 0;
    currentX += (pointerX - currentX) * 0.045;
    currentY += (pointerY - currentY) * 0.045;
    const model = multiply(
      multiply(
        rz(-0.5 + scroll * 0.35),
        ry(0.35 + (moving ? elapsed * 0.075 + currentX * 0.3 : 0)),
      ),
      rx(0.55 + (moving ? currentY * 0.22 + scroll * 0.6 : 0)),
    );
    gl.uniformMatrix4fv(modelLocation, false, model);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || paused()) return;
    if (now - last >= 32) {
      elapsed += Math.min((now - last) / 1000, 0.05);
      last = now;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && visible && !document.hidden && !paused()) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (paused()) draw();
  }
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width - 0.5;
    pointerY = (e.clientY - r.top) / r.height - 0.5;
  });
  stage.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      start();
    },
    { rootMargin: "50px" },
  ).observe(canvas);
  document.addEventListener("visibilitychange", start);
  document.addEventListener("portfolio:motion", start);
  reduced.addEventListener("change", start);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    stage.classList.remove("has-webgl");
  });
  // Keep the typographic fallback after GPU context loss; never reload a page
  // that might contain an unsent message. A normal navigation rebuilds the scene.
  stage.classList.add("has-webgl");
  resize();
  start();
})();
