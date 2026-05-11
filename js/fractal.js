// Fractal rendering — Mandelbrot + Julia sets

const PALETTES = {
  neon: [
    [12, 8, 28],
    [60, 20, 140],
    [154, 123, 255],
    [34, 232, 212],
    [255, 212, 71],
    [255, 255, 240]
  ],
  paper: [
    [243, 239, 227],
    [198, 175, 80],
    [194, 58, 30],
    [74, 44, 176],
    [31, 107, 77],
    [21, 19, 13]
  ],
  emerald: [
    [6, 20, 16],
    [12, 60, 42],
    [43, 212, 138],
    [230, 255, 244],
    [255, 204, 92],
    [255, 122, 107]
  ],
  psych: [
    [26, 6, 36],
    [162, 107, 255],
    [255, 79, 168],
    [255, 212, 71],
    [76, 240, 255],
    [255, 241, 217]
  ],
};

function lerp(a, b, t) { return a + (b - a) * t; }
function rampColor(palette, t) {
  if (!isFinite(t) || t < 0) t = 0;
  const n = palette.length - 1;
  const x = t * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = palette[Math.max(0, Math.min(n, i))];
  const b = palette[Math.max(0, Math.min(n, i + 1))];
  return [lerp(a[0],b[0],f), lerp(a[1],b[1],f), lerp(a[2],b[2],f)];
}

function renderFractal(canvas, opts) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const { cx = -0.5, cy = 0, zoom = 1, maxIter = 180, palette = PALETTES.neon,
          juliaC, fractal = 'mandelbrot', colorShift = 0 } = opts;

  const scale = 3 / zoom;
  const aspect = H / W;

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const x0 = cx + (px / W - 0.5) * scale;
      const y0 = cy + (py / H - 0.5) * scale * aspect;

      let zx, zy, cr, ci;
      if (fractal === 'julia') {
        zx = x0; zy = y0;
        cr = juliaC[0]; ci = juliaC[1];
      } else {
        zx = 0; zy = 0;
        cr = x0; ci = y0;
      }

      let iter = 0;
      let zx2 = zx * zx, zy2 = zy * zy;
      const bail = 256;
      while (zx2 + zy2 < bail && iter < maxIter) {
        zy = 2 * zx * zy + ci;
        zx = zx2 - zy2 + cr;
        zx2 = zx * zx;
        zy2 = zy * zy;
        iter++;
      }

      const idx = (py * W + px) * 4;
      if (iter >= maxIter) {
        data[idx] = palette[0][0];
        data[idx+1] = palette[0][1];
        data[idx+2] = palette[0][2];
        data[idx+3] = 255;
      } else {
        const log_zn = Math.log(zx2 + zy2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        const smooth = iter + 1 - nu;
        let t = smooth / maxIter;
        t = Math.pow(t, 0.55);
        t = (t + colorShift) % 1;
        const [r,g,b] = rampColor(palette, t);
        data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ---------- Interactive Mandelbrot hero (used in Science section) ---------- */
function HeroMandelbrot({ paletteName, showCoords = true, markers, activeMarker, onMarkerClick, flyTarget }) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [view, setView] = React.useState({ cx: -0.7, cy: 0, zoom: 1 });
  const [hoverCoord, setHoverCoord] = React.useState(null);
  const [rendering, setRendering] = React.useState(false);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

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
    const c = canvasRef.current;
    if (!c) return;
    setRendering(true);
    const id = requestAnimationFrame(() => {
      renderFractal(c, {
        cx: view.cx, cy: view.cy, zoom: view.zoom,
        maxIter: Math.min(500, 120 + Math.log2(view.zoom) * 30),
        palette: PALETTES[paletteName] || PALETTES.neon,
        fractal: 'mandelbrot',
      });
      setRendering(false);
    });
    return () => cancelAnimationFrame(id);
  }, [view, paletteName]);

  const coordsFromEvent = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const scale = 3 / view.zoom;
    return [view.cx + (px - 0.5) * scale, view.cy + (py - 0.5) * scale];
  };

  const handleClick = (e) => {
    const [x, y] = coordsFromEvent(e);
    setView(v => ({ cx: x, cy: y, zoom: v.zoom * 2.5 }));
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setView(v => ({ ...v, zoom: Math.max(0.6, v.zoom / 2.5) }));
  };

  const handleDoubleClick = () => setView({ cx: -0.7, cy: 0, zoom: 1 });

  return (
    <div className="hero-canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onMouseMove={(e) => setHoverCoord(coordsFromEvent(e))}
        onMouseLeave={() => setHoverCoord(null)}
      />
      <div className="canvas-label">Mandelbrot set · z↦z²+c</div>
      {showCoords && (
        <div className="coord-readout">
          {hoverCoord
            ? `c = ${hoverCoord[0].toFixed(4)} ${hoverCoord[1] >= 0 ? '+' : '-'} ${Math.abs(hoverCoord[1]).toFixed(4)}i`
            : `zoom ×${view.zoom < 10 ? view.zoom.toFixed(2) : view.zoom.toExponential(1)}`}
        </div>
      )}
      <div className="canvas-hud">
        <button className="hud-btn" onClick={() => setView(v => ({...v, zoom: Math.max(0.6, v.zoom/2)}))}>−</button>
        <button className="hud-btn" onClick={handleDoubleClick}>⌂</button>
        <button className="hud-btn" onClick={() => setView(v => ({...v, zoom: v.zoom*2}))}>+</button>
      </div>
      {rendering && (
        <div style={{
          position:'absolute', left:12, bottom:44,
          fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(255,255,255,0.6)',
          letterSpacing:'0.1em'
        }}>computing…</div>
      )}
    </div>
  );
}

/* ---------- Julia set badge for section headers ---------- */
function JuliaBadge({ c, paletteName, size = 120 }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    renderFractal(canvas, {
      cx: 0, cy: 0, zoom: 0.7,
      maxIter: 120,
      palette: PALETTES[paletteName] || PALETTES.neon,
      fractal: 'julia',
      juliaC: c,
    });
  }, [c, paletteName, size]);
  return <canvas ref={canvasRef} style={{width:size, height:size}} />;
}

/* ---------- Album art for the music player ---------- */
function AlbumArt({ paletteName, seed = 0 }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(200, rect.width) * dpr;
    canvas.height = Math.max(200, rect.height) * dpr;
    const cs = [
      [-0.8, 0.156], [-0.4, 0.6], [0.285, 0.01],
      [-0.7269, 0.1889], [0.37, 0.1], [-0.123, 0.745],
    ];
    const c = cs[seed % cs.length];
    renderFractal(canvas, {
      cx: 0, cy: 0, zoom: 0.65,
      maxIter: 160,
      palette: PALETTES[paletteName] || PALETTES.neon,
      fractal: 'julia',
      juliaC: c,
      colorShift: (seed * 0.17) % 1,
    });
  }, [paletteName, seed]);
  return <canvas ref={canvasRef} style={{width:'100%', height:'100%'}} />;
}

Object.assign(window, { PALETTES, rampColor, renderFractal, HeroMandelbrot, JuliaBadge, AlbumArt });
