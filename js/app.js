/* Main app — composes hero + all sections */

function computeAge(birthDateStr) {
  const now = new Date();
  const birth = new Date(birthDateStr);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const CASTIEL_AGE = computeAge('2015-01-28');

const NAV_MARKERS = [
  { id: 'music',   label: 'Music',   num: '01', vertexIdx: 0  },
  { id: 'coding',  label: 'Coding',  num: '02', vertexIdx: 6  },
  { id: 'science', label: 'Science', num: '03', vertexIdx: 3  },
  { id: 'books',   label: 'Books',   num: '04', vertexIdx: 11 },
  { id: 'movies',  label: 'Movies',  num: '05', vertexIdx: 15 },
];

function Tweaks({ state, setState, visible }) {
  if (!visible) return null;
  const palettes = [
    { key: 'neon',    label: 'Neon',    swatch: 'linear-gradient(135deg,#9a7bff,#22e8d4,#ffd447)' },
    { key: 'paper',   label: 'Paper',   swatch: 'linear-gradient(135deg,#4a2cb0,#c23a1e,#c28a00)' },
    { key: 'emerald', label: 'Emerald', swatch: 'linear-gradient(135deg,#2bd48a,#e6fff4,#ffcc5c)' },
    { key: 'psych',   label: 'Psych',   swatch: 'linear-gradient(135deg,#ff4fa8,#ffd447,#4cf0ff)' },
  ];
  const types = [
    { key: 'editorial', label: 'Editorial' },
    { key: 'terminal',  label: 'Terminal' },
    { key: 'playful',   label: 'Playful' },
  ];
  const speeds = [
    { key: 0.4, label: 'Slow' },
    { key: 1,   label: 'Normal' },
    { key: 2,   label: 'Fast' },
  ];

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }));

  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <div className="label">Palette</div>
        <div className="opts">
          {palettes.map(p => (
            <button key={p.key}
              className={"tweak-btn" + (state.palette === p.key ? ' active' : '')}
              onClick={() => set('palette', p.key)}>
              <span className="tweak-swatch" style={{background: p.swatch}} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <div className="label">Typography</div>
        <div className="opts">
          {types.map(t => (
            <button key={t.key}
              className={"tweak-btn" + (state.typeMode === t.key ? ' active' : '')}
              onClick={() => set('typeMode', t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <div className="label">Rotation speed</div>
        <div className="opts">
          {speeds.map(s => (
            <button key={s.key}
              className={"tweak-btn" + (state.rotSpeed === s.key ? ' active' : '')}
              onClick={() => set('rotSpeed', s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <div className="label">Show coords</div>
        <div className="opts">
          <button className={"tweak-btn" + (state.showCoords ? ' active' : '')} onClick={() => set('showCoords', true)}>On</button>
          <button className={"tweak-btn" + (!state.showCoords ? ' active' : '')} onClick={() => set('showCoords', false)}>Off</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = React.useState({
    palette: 'neon',
    typeMode: 'editorial',
    showCoords: true,
    rotSpeed: 1,
  });
  const [tweaksOn, setTweaksOn] = React.useState(false);
  const [flyTarget, setFlyTarget] = React.useState(null);
  const [activeSection, setActiveSection] = React.useState(null);

  // Track which section is in view
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    NAV_MARKERS.forEach(m => {
      const el = document.getElementById(m.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const navigateTo = (m) => {
    setFlyTarget({ vertexIdx: m.vertexIdx, _t: Date.now() });
    setTimeout(() => {
      const el = document.getElementById(m.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  // Apply palette + type to <body>
  React.useEffect(() => {
    document.body.setAttribute('data-palette', state.palette);
    document.body.setAttribute('data-type', state.typeMode);
  }, [state.palette, state.typeMode]);

  // Tweaks panel activation via postMessage (from claude.ai/design editor)
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOn(true);
      else if (e.data.type === '__deactivate_edit_mode') setTweaksOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            <span>Castiel Engle</span>
            <span style={{color:'var(--ink-faint)', fontFamily:'var(--font-mono)', fontSize:12, marginLeft:6}}>/ ∞</span>
          </div>
          <nav className="links">
            <MiniTesseract
              paletteName={state.palette}
              markers={NAV_MARKERS}
              activeId={activeSection}
              onNav={navigateTo}
            />
            {NAV_MARKERS.map(m => (
              <a key={m.id} href={"#" + m.id}
                 className={activeSection === m.id ? 'is-active' : ''}
                 onClick={(e) => { e.preventDefault(); navigateTo(m); }}>
                <span className="dot"/>{m.label.toLowerCase()}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero-grid">
            <div>
              <div className="hero-kicker">
                <span className="blink" />
                <span>personal site · v2 · est. 2026</span>
              </div>
              <h1>
                Hello,<br/>
                <em>world.</em><br/>
                I'm Castiel<span className="inf"> ∞</span>
              </h1>
              <p className="hero-sub">
                {CASTIEL_AGE} years old. Drummer, pianist, Python apprentice, and obsessed with the shape on the right (it's a <em>tesseract</em> — a cube, but in 4D). This page is a collection of things I've made and things I've loved.
              </p>
              <div className="hero-chips">
                <Chip glyph="♩">drums</Chip>
                <Chip glyph="♪">piano</Chip>
                <Chip glyph="{}">python</Chip>
                <Chip glyph="∑">math</Chip>
                <Chip glyph="⊙">astronomy</Chip>
                <Chip glyph="✦">books</Chip>
              </div>
            </div>
            <HeroTesseract
              paletteName={state.palette}
              showCoords={state.showCoords}
              speed={state.rotSpeed || 1}
              markers={NAV_MARKERS}
              activeMarker={activeSection}
              onMarkerClick={navigateTo}
              flyTarget={flyTarget}
            />
          </div>
          <div style={{
            marginTop: 36, display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--ink-faint)', letterSpacing: '0.18em', textTransform: 'uppercase'
          }}>
            <span>click a section dot to fly there · the cube rotates in 4D · vertices brighter when closer to you</span>
            <span>↓ scroll</span>
          </div>
        </section>

        <MusicSection paletteName={state.palette} />
        <CodingSection paletteName={state.palette} />
        <ScienceSection paletteName={state.palette} />
        <BooksSection paletteName={state.palette} />
        <MoviesSection paletteName={state.palette} />

        <footer className="foot">
          <div className="f-sig">made by castiel engle</div>
          <div className="f-inf">∞</div>
          <div className="f-made">some infinities<br/>are bigger than others.</div>
        </footer>
      </main>

      <Tweaks state={state} setState={setState} visible={tweaksOn} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
