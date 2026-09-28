/* Original blue sculpture plus theme-specific procedural forms. */
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
    uniform vec3 ceilingLight; uniform vec3 accentEdge; uniform vec3 accentFloor;
    uniform vec3 materialTint; uniform vec3 fresnelTint; uniform vec3 ambientTint;
    uniform float facetMaterial;
    vec3 studio(vec3 r){
      vec3 c=vec3(.012,.019,.035);
      float ceiling=smoothstep(.05,.45,r.y);
      c+=ceilingLight*ceiling;
      float softbox=pow(max(0.,dot(r,normalize(vec3(-.6,1.,1.)))),10.);
      c+=vec3(2.5,2.7,3.0)*softbox;
      float strip=exp(-pow((r.x+.38)*15.,2.))*smoothstep(-.65,-.1,r.y);
      c+=vec3(3.0,3.15,3.4)*strip;
      float edge=pow(max(0.,dot(r,normalize(vec3(1.,.25,-.6)))),7.);
      c+=accentEdge*edge;
      float floorLight=pow(max(0.,dot(r,normalize(vec3(-.3,-1.,.5)))),16.);
      c+=accentFloor*floorLight;
      return c;
    }
    void main(){
      vec3 n=normalize(worldNormal);
      if(facetMaterial>.5){vec3 face=sign(n)*step(vec3(.42),abs(n));n=normalize(face);}
      vec3 view=normalize(vec3(0.,0.,5.8)-worldPosition);
      vec3 reflection=reflect(-view,n);
      float fresnel=pow(1.-max(0.,dot(n,view)),3.);
      vec3 col=studio(reflection)*materialTint;
      col+=ambientTint+fresnel*fresnelTint;
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
  const attributeBuffers = {};
  for (const [name, data] of [
    ["position", positions],
    ["normal", normals],
  ]) {
    const buffer = gl.createBuffer();
    attributeBuffers[name] = buffer;
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
    projectionLocation = gl.getUniformLocation(program, "projection"),
    uniforms = Object.fromEntries(
      ["ceilingLight", "accentEdge", "accentFloor", "materialTint", "fresnelTint", "ambientTint", "facetMaterial"].map(
        (name) => [name, gl.getUniformLocation(program, name)],
      ),
    );
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
    elapsed = 0,
    geometryPositions = new Float32Array(positions),
    geometryNormals = new Float32Array(normals),
    transition = null,
    activeTheme = "blue";
  const material = {
    blue: {
      ceilingLight: [.34, .40, .53], accentEdge: [.07, .23, 1.6],
      accentFloor: [.03, .17, .9], materialTint: [.82, .87, .98],
      fresnelTint: [.04, .08, .19], ambientTint: [.024, .035, .075], facetMaterial: 0,
    },
    purple: {
      ceilingLight: [.38, .32, .58], accentEdge: [.72, .25, 1.55],
      accentFloor: [.34, .12, .82], materialTint: [.86, .78, 1.04],
      fresnelTint: [.12, .07, .27], ambientTint: [.04, .025, .085], facetMaterial: 1,
    },
    red: {
      ceilingLight: [.52, .31, .32], accentEdge: [1.65, .24, .19],
      accentFloor: [.88, .09, .08], materialTint: [1.04, .78, .74],
      fresnelTint: [.25, .055, .04], ambientTint: [.08, .025, .025], facetMaterial: 0,
    },
    pink: {
      ceilingLight: [.54, .34, .47], accentEdge: [1.35, .34, .92],
      accentFloor: [.72, .16, .47], materialTint: [1.02, .83, .96],
      fresnelTint: [.22, .08, .17], ambientTint: [.075, .03, .06], facetMaterial: 0,
    },
    orange: {
      ceilingLight: [.52, .39, .27], accentEdge: [1.55, .78, .22],
      accentFloor: [.88, .39, .08], materialTint: [1.04, .91, .76],
      fresnelTint: [.24, .13, .045], ambientTint: [.08, .045, .02], facetMaterial: 0,
    },
    cyan: {
      ceilingLight: [.27, .49, .52], accentEdge: [.12, 1.05, 1.25],
      accentFloor: [.025, .63, .76], materialTint: [.75, 1.02, 1.04],
      fresnelTint: [.035, .22, .24], ambientTint: [.02, .065, .075], facetMaterial: 0,
    },
    yellow: {
      ceilingLight: [.52, .46, .29], accentEdge: [1.28, .93, .2],
      accentFloor: [.72, .48, .07], materialTint: [1.03, .94, .72],
      fresnelTint: [.22, .16, .035], ambientTint: [.07, .055, .02], facetMaterial: 1,
    },
    green: {
      ceilingLight: [.31, .49, .37], accentEdge: [.23, 1.18, .57],
      accentFloor: [.07, .72, .29], materialTint: [.79, 1.02, .84],
      fresnelTint: [.055, .24, .10], ambientTint: [.025, .07, .04], facetMaterial: 0,
    },
  };
  const pointForTheme = (theme, u, v) => {
    const longitude = u * Math.PI * 2;
    const latitude = (v - .5) * Math.PI;
    const ring = Math.cos(latitude);
    const height = Math.sin(latitude);
    const signPower = (value, power) => Math.sign(value) * Math.pow(Math.abs(value), power);
    if (theme === "red") {
      const angle = longitude * 2;
      const width = (v - .5) * .92;
      const radius = 1.05 + width * Math.cos(angle * .5);
      return [radius * Math.cos(angle), radius * Math.sin(angle), width * Math.sin(angle * .5)];
    }
    if (theme === "orange" || theme === "cyan") {
      const waves = theme === "cyan" ? 9 : 3;
      const major = 1.08 + (theme === "cyan" ? .09 : .14) * Math.cos(waves * longitude);
      const tube = (theme === "cyan" ? .32 : .29) + (theme === "cyan" ? .035 : .08) * Math.sin(waves * longitude);
      const crossSection = v * Math.PI * 2;
      const radius = major + tube * Math.cos(crossSection);
      const ellipse = theme === "orange" ? .82 : 1;
      const wave = theme === "orange" ? .18 * Math.sin(longitude * 2) : 0;
      return [radius * Math.cos(longitude), ellipse * radius * Math.sin(longitude), tube * Math.sin(crossSection) + wave];
    }
    if (theme === "purple") {
      return [
        1.18 * signPower(ring * Math.cos(longitude), .62),
        .98 * signPower(ring * Math.sin(longitude), .62),
        1.42 * signPower(height, .62),
      ];
    }
    if (theme === "pink") {
      const radius = 1 + .24 * Math.cos(longitude * 6) * Math.pow(Math.max(0, ring), 1.7);
      return [1.08 * radius * ring * Math.cos(longitude), radius * ring * Math.sin(longitude), 1.12 * height];
    }
    if (theme === "yellow") {
      const radius = 1 + .25 * Math.cos(longitude * 8) * Math.pow(Math.max(0, ring), .8);
      return [radius * ring * Math.cos(longitude), radius * ring * Math.sin(longitude), 1.16 * height];
    }
    if (theme === "green") {
      const waist = Math.pow(Math.max(0, ring), .78);
      return [
        1.28 * waist * Math.cos(longitude) + .13 * height,
        .62 * waist * Math.sin(longitude),
        1.5 * signPower(height, .78),
      ];
    }
    return knot(longitude);
  };
  function geometryFor(theme) {
    if (theme === "blue") return { positions: new Float32Array(positions), normals: new Float32Array(normals) };
    const nextPositions = new Float32Array((segments + 1) * (sides + 1) * 3);
    const nextNormals = new Float32Array(nextPositions.length);
    const offset = (i, j) => (i * (sides + 1) + j) * 3;
    for (let i = 0; i <= segments; i++)
      for (let j = 0; j <= sides; j++)
        nextPositions.set(pointForTheme(theme, i / segments, j / sides), offset(i, j));
    for (let i = 0; i <= segments; i++)
      for (let j = 0; j <= sides; j++) {
        const beforeI = ((i - 1 + segments) % segments), afterI = (i + 1) % segments;
        const beforeJ = Math.max(0, j - 1), afterJ = Math.min(sides, j + 1);
        const pI0 = offset(beforeI, j), pI1 = offset(afterI, j);
        const pJ0 = offset(i, beforeJ), pJ1 = offset(i, afterJ);
        const du = [0, 1, 2].map((k) => nextPositions[pI1 + k] - nextPositions[pI0 + k]);
        const dv = [0, 1, 2].map((k) => nextPositions[pJ1 + k] - nextPositions[pJ0 + k]);
        let n = cross(du, dv);
        if (theme !== "red") {
          const p = [nextPositions[offset(i, j)], nextPositions[offset(i, j) + 1], nextPositions[offset(i, j) + 2]];
          if (n[0] * p[0] + n[1] * p[1] + n[2] * p[2] < 0) n = n.map((x) => -x);
        }
        n = normalize(n);
        nextNormals.set(n, offset(i, j));
      }
    return { positions: nextPositions, normals: nextNormals };
  }
  function uploadGeometry(positionData, normalData) {
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.DYNAMIC_DRAW);
  }
  function applyTheme(theme) {
    const id = material[theme] ? theme : "blue";
    if (id === activeTheme) return;
    activeTheme = id;
    const colors = material[id];
    for (const [name, value] of Object.entries(colors))
      name === "facetMaterial" ? gl.uniform1f(uniforms[name], value) : gl.uniform3fv(uniforms[name], value);
    const geometry = geometryFor(id);
    if (paused()) {
      geometryPositions = geometry.positions;
      geometryNormals = geometry.normals;
      transition = null;
      uploadGeometry(geometryPositions, geometryNormals);
      draw();
      return;
    }
    transition = {
      fromPositions: geometryPositions.slice(), fromNormals: geometryNormals.slice(),
      toPositions: geometry.positions, toNormals: geometry.normals, elapsed: 0,
    };
    start();
  }
  document.addEventListener("portfolio:themechange", (event) => applyTheme(event.detail?.id));
  for (const [name, value] of Object.entries(material.blue))
    name === "facetMaterial" ? gl.uniform1f(uniforms[name], value) : gl.uniform3fv(uniforms[name], value);
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
        rz(-0.5 + scroll * 0.35 + (moving ? Math.sin(elapsed * 0.34) * 0.06 : 0)),
        ry(0.35 + (moving ? elapsed * 0.22 + currentX * 0.3 : 0)),
      ),
      rx(0.55 + (moving ? currentY * 0.22 + scroll * 0.6 + Math.sin(elapsed * 0.46) * 0.09 : 0)),
    );
    gl.uniformMatrix4fv(modelLocation, false, model);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || paused()) return;
    const shouldDraw = now - last >= 32;
    const delta = Math.min((now - last) / 1000, 0.05);
    elapsed += delta;
    last = now;
    if (transition) {
      transition.elapsed += delta;
      const raw = Math.min(transition.elapsed / .72, 1);
      const eased = raw * raw * (3 - 2 * raw);
      for (let i = 0; i < geometryPositions.length; i++) {
        geometryPositions[i] = transition.fromPositions[i] + (transition.toPositions[i] - transition.fromPositions[i]) * eased;
        geometryNormals[i] = transition.fromNormals[i] + (transition.toNormals[i] - transition.fromNormals[i]) * eased;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffers.position);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometryPositions);
      gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffers.normal);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometryNormals);
      if (raw >= 1) {
        geometryPositions = transition.toPositions;
        geometryNormals = transition.toNormals;
        transition = null;
      }
      draw();
    } else if (shouldDraw) {
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
