/* Tesseract renderer — 4D hypercube projected to 2D.
 * Verts at (±1,±1,±1,±1), edges between vertices differing in exactly one bit.
 */

const VERTS4 = (() => {
  const out = [];
  for (let i = 0; i < 16; i++) {
    out.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1,
    ]);
  }
  return out;
})();

const EDGES4 = (() => {
  const out = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const d = i ^ j;
      if (d === 1 || d === 2 || d === 4 || d === 8) out.push([i, j]);
    }
  }
  return out;
})();

function rotate4D(v, a) {
  let [x, y, z, w] = v;
  let c, s;
  c = Math.cos(a.xw); s = Math.sin(a.xw);
  [x, w] = [c*x - s*w, s*x + c*w];
  c = Math.cos(a.yw); s = Math.sin(a.yw);
  [y, w] = [c*y - s*w, s*y + c*w];
  c = Math.cos(a.zw); s = Math.sin(a.zw);
  [z, w] = [c*z - s*w, s*z + c*w];
  c = Math.cos(a.xz); s = Math.sin(a.xz);
  [x, z] = [c*x - s*z, s*x + c*z];
  c = Math.cos(a.yz); s = Math.sin(a.yz);
  [y, z] = [c*y - s*z, s*y + c*z];
  return [x, y, z, w];
}

function project4(v, Wdist = 2.4, Zdist = 3.2) {
  const wf = 1 / (Wdist - v[3]);
  const x3 = v[0] * wf;
  const y3 = v[1] * wf;
  const z3 = v[2] * wf;
  const zf = 1 / (Zdist - z3);
  return { x: x3 * zf, y: y3 * zf, depth: z3, wd: v[3] };
}

function tessColor(paletteName, t) {
  const p = PALETTES[paletteName] || PALETTES.neon;
  return rampColor(p, Math.max(0, Math.min(1, t)));
}

/* ---------- Hero tesseract (large, with section markers) ---------- */
function HeroTesseract({ paletteName, markers, activeMarker, onMarkerClick, flyTarget, showCoords, speed = 1 }) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const markersRef = React.useRef({});
  const [hoverInfo, setHoverInfo] = React.useState(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const stateRef = React.useRef({
    angles: { xw: 0.5, yw: 0.4, xz: 0.2, yz: 0.1, zw: 0 },
    flyBoost: 0,
  });

  React.useLayoutEffect(() => {
    const c = canvasRef.current;
    const w = wrapRef.current;
    if (!c || !w) return;
    const rect = w.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    c.style.width = rect.width + 'px';
    c.style.height = rect.height + 'px';
    setSize({ w: rect.width, h: rect.height });
  }, []);

  React.useEffect(() => {
    if (!flyTarget) return;
    stateRef.current.flyBoost = 1;
  }, [flyTarget]);

  React.useEffect(() => {
    if (!size.w) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let last = performance.now();

    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const boost = 1 + st.flyBoost * 2.5;
      st.angles.xw += dt * 0.32 * speed * boost;
      st.angles.yw += dt * 0.41 * speed * boost;
      st.angles.zw += dt * 0.19 * speed * boost;
      st.angles.xz += dt * 0.14 * speed * boost;
      st.angles.yz += dt * 0.09 * speed * boost;
      st.flyBoost = Math.max(0, st.flyBoost - dt * 1.4);

      const W = c.width, H = c.height;
      const cx = W / 2, cy = H / 2;
      const scale = Math.min(W, H) * 0.32;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(cx, cy, scale*0.5, cx, cy, scale*2.2);
      const accent = tessColor(paletteName, 0.55);
      grad.addColorStop(0, `rgba(${accent[0]|0},${accent[1]|0},${accent[2]|0},0.18)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const projected = VERTS4.map(v => {
        const r = rotate4D(v, st.angles);
        const p = project4(r);
        return { sx: cx + p.x * scale, sy: cy + p.y * scale, depth: p.depth, wd: r[3], rotated: r };
      });

      const edgeOrder = EDGES4.map(([i,j]) => {
        const a = projected[i], b = projected[j];
        return { i, j, mid: (a.depth + b.depth) / 2 };
      }).sort((a, b) => a.mid - b.mid);

      ctx.lineCap = 'round';
      for (const e of edgeOrder) {
        const a = projected[e.i], b = projected[e.j];
        const tDepth = (e.mid + 1) / 2;
        const tW = ((projected[e.i].wd + projected[e.j].wd) / 2 + 1.5) / 3;
        const col = tessColor(paletteName, 0.25 + tW * 0.65);
        ctx.strokeStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${0.35 + tDepth * 0.55})`;
        ctx.lineWidth = (0.6 + tDepth * 2.2) * dpr;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const tD = (p.depth + 1) / 2;
        const tW = (p.wd + 1.5) / 3;
        const col = tessColor(paletteName, 0.5 + tW * 0.5);
        ctx.fillStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${0.6 + tD * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, (1.5 + tD * 2.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (markers) {
        const scaleCSS = Math.min(size.w, size.h) * 0.32;
        for (const m of markers) {
          const el = markersRef.current[m.id];
          if (!el) continue;
          const v = VERTS4[m.vertexIdx];
          const r = rotate4D(v, st.angles);
          const p = project4(r);
          const x = size.w / 2 + p.x * scaleCSS;
          const y = size.h / 2 + p.y * scaleCSS;
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          const tD = (p.depth + 1) / 2;
          el.style.opacity = (0.55 + tD * 0.45).toFixed(3);
          el.style.zIndex = Math.floor(20 + tD * 30);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, paletteName, markers, speed]);

  const onMove = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (Math.min(rect.width, rect.height) * 0.32);
    const y = (e.clientY - rect.top - rect.height / 2) / (Math.min(rect.width, rect.height) * 0.32);
    setHoverInfo({ x, y });
  };

  return (
    <div className="hero-canvas-wrap tesseract-wrap" ref={wrapRef}
         onMouseMove={onMove} onMouseLeave={() => setHoverInfo(null)}>
      <canvas ref={canvasRef} />
      <div className="canvas-label">Tesseract · 4-cube · 16 vertices · 32 edges</div>
      {showCoords && (
        <div className="coord-readout">
          {hoverInfo
            ? `xy = (${hoverInfo.x.toFixed(2)}, ${hoverInfo.y.toFixed(2)})`
            : `rotating in ℝ⁴ · planes xw, yw, zw`}
        </div>
      )}
      {markers && markers.map(m => (
        <button
          key={m.id}
          ref={el => { markersRef.current[m.id] = el; }}
          className={"hero-marker tesseract-marker" + (activeMarker === m.id ? ' active' : '')}
          onClick={(e) => { e.stopPropagation(); onMarkerClick && onMarkerClick(m); }}
        >
          <span className="hero-marker-dot" />
          <span className="hero-marker-label">
            <span className="hm-num">§{m.num}</span>
            <span className="hm-name">{m.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Mini rotating tesseract for the topbar nav ---------- */
function MiniTesseract({ paletteName, markers, activeId, onNav }) {
  const W = 92, H = 56;
  const canvasRef = React.useRef(null);
  const dotsRef = React.useRef({});

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext('2d');
    let raf;
    let last = performance.now();
    const angles = { xw: 0.3, yw: 0.5, zw: 0.1, xz: 0.2, yz: 0.05 };

    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angles.xw += dt * 0.35; angles.yw += dt * 0.42; angles.zw += dt * 0.18;
      const cw = c.width, ch = c.height;
      ctx.clearRect(0, 0, cw, ch);
      const scale = Math.min(cw, ch) * 0.32;
      const cx = cw / 2, cy = ch / 2;

      const projected = VERTS4.map(v => {
        const r = rotate4D(v, angles);
        const p = project4(r);
        return { sx: cx + p.x * scale, sy: cy + p.y * scale, depth: p.depth, wd: r[3] };
      });

      for (const [i,j] of EDGES4) {
        const a = projected[i], b = projected[j];
        const tD = ((a.depth + b.depth) / 2 + 1) / 2;
        const col = tessColor(paletteName, 0.45 + tD * 0.4);
        ctx.strokeStyle = `rgba(${col[0]|0},${col[1]|0},${col[2]|0},${0.45 + tD * 0.5})`;
        ctx.lineWidth = (0.5 + tD * 1.2) * dpr;
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      }

      if (markers) {
        const cssScale = Math.min(W, H) * 0.32;
        for (const m of markers) {
          const el = dotsRef.current[m.id];
          if (!el) continue;
          const v = VERTS4[m.vertexIdx];
          const r = rotate4D(v, angles);
          const p = project4(r);
          const x = W / 2 + p.x * cssScale;
          const y = H / 2 + p.y * cssScale;
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          const tD = (p.depth + 1) / 2;
          el.style.opacity = (0.5 + tD * 0.5).toFixed(3);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [paletteName, markers]);

  return (
    <div className="mini-nav mini-tess" style={{ width: W, height: H }}>
      <canvas ref={canvasRef} style={{ width: W, height: H }} />
      {markers && markers.map(m => (
        <button
          key={m.id}
          ref={el => { dotsRef.current[m.id] = el; }}
          className={"mini-dot" + (activeId === m.id ? ' active' : '')}
          title={`${m.label} · v${m.vertexIdx}`}
          onClick={() => onNav(m)}
        />
      ))}
    </div>
  );
}

Object.assign(window, { HeroTesseract, MiniTesseract, VERTS4, EDGES4, rotate4D, project4 });
