/* Section components — Coding, Science, Books, Movies + shared helpers */

function SectionHead({ index, title, juliaC, paletteName, cLabel, lede, ledeAlt }) {
  return (
    <div className="sec-head">
      <div className="sec-index">
        <div>{index}</div>
        <div className="julia">
          <JuliaBadge c={juliaC} paletteName={paletteName} size={120} />
        </div>
        <span className="c-val">c = {cLabel}</span>
      </div>
      <div>
        <h2>{title}</h2>
        <p className="sec-lede">{lede}</p>
        {ledeAlt && <p className="sec-lede-alt">{ledeAlt}</p>}
      </div>
    </div>
  );
}

function Chip({ glyph, children }) {
  return <span className="chip"><span className="glyph">{glyph}</span>{children}</span>;
}

/* ---------- Coding section ---------- */
const RPG_SCRIPT = [
  { t: '$ python dungeon.py', cls: 'yellow', wait: 400 },
  { t: '', wait: 200 },
  { t: 'you are in a DIMLY LIT CORRIDOR.', cls: 'dim', wait: 500 },
  { t: 'a SLIME blocks the path. hp: 12/12', wait: 500 },
  { t: '', wait: 200 },
  { t: '> attack', cls: 'purple', wait: 600 },
  { t: 'you roll a d20…  ', wait: 400 },
  { t: '  [17]  critical hit!', cls: 'pink', wait: 500 },
  { t: 'the slime dissolves into 6 gold pieces.', wait: 500 },
  { t: '', wait: 200 },
  { t: '> inventory', cls: 'purple', wait: 500 },
  { t: '  - rusty sword  (+3 atk)', wait: 300 },
  { t: '  - lantern      (lit)',   wait: 300 },
  { t: '  - gold × 6',             wait: 300 },
  { t: '  - mysterious seashell',  wait: 300 },
  { t: '', wait: 200 },
  { t: '> open door --north', cls: 'purple', wait: 600 },
  { t: 'the door swings open.', cls: 'dim', wait: 500 },
  { t: 'you step into ROOM 04.', wait: 300 },
  { t: '> _', cls: 'purple', wait: 0 },
];

function Terminal() {
  const [lines, setLines] = React.useState([]);
  const [started, setStarted] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!started) return;
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled || i >= RPG_SCRIPT.length) return;
      const line = RPG_SCRIPT[i];
      setLines(prev => [...prev, line]);
      i++;
      setTimeout(tick, line.wait);
    };
    tick();
    return () => { cancelled = true; };
  }, [started]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) setStarted(true);
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  return (
    <div className="terminal" ref={ref}>
      <div className="term-bar">
        <div className="dot d1" /><div className="dot d2" /><div className="dot d3" />
        <div className="t">dungeon.py — python 3.12</div>
      </div>
      <div className="term-body">
        {lines.map((l, i) => (
          <div key={i} className={l.cls || ''}>{l.t || ' '}</div>
        ))}
        {started && lines.length >= RPG_SCRIPT.length && <span className="cursor" />}
        {!started && <div className="dim">// scroll down to run…</div>}
      </div>
    </div>
  );
}

const PROJECTS = [
  {
    name: 'dungeon.py',
    desc: 'A text-based RPG with rooms, monsters, loot, and dice rolls. Written in Python with a dictionary-based world map. Currently: 12 rooms, 5 monsters, 1 boss.',
    tags: ['python', 'game', 'in-progress'],
  },
  {
    name: 'FractalZoo',
    desc: 'Scratch project that lets you pick a fractal (Sierpinski triangle, Koch snowflake, H-tree) and watch it draw itself recursively.',
    tags: ['scratch', 'fractals'],
  },
  {
    name: 'castiel-engle.com',
    desc: 'This website! HTML/CSS/JS with a live Mandelbrot set you can zoom into, and a rotating 4D tesseract.',
    tags: ['html', 'css', 'js'],
  },
  {
    name: 'prime.py',
    desc: 'Finds prime numbers using the Sieve of Eratosthenes. Fastest so far: first 10,000 primes in under a second.',
    tags: ['python', 'math'],
  },
];

function CodingSection({ paletteName }) {
  return (
    <section className="sec" id="coding">
      <SectionHead
        index="§ 02 · CODING"
        title={<>Turning ideas into <em>machines</em>.</>}
        juliaC={[-0.4, 0.6]}
        cLabel="−0.40 + 0.600i"
        paletteName={paletteName}
        lede="I started with Scratch — blocks snapping together. Now I write Python. Every bug I squash makes the game better."
        ledeAlt="Coding is a puzzle where I'm the designer, the solver, and the player, all at once."
      />
      <div className="code-grid">
        <Terminal />
        <div className="projects-stack">
          {PROJECTS.map(p => (
            <div className="project-card" key={p.name}>
              <div className="pc-name">{p.name}</div>
              <div className="pc-arrow">→</div>
              <div className="pc-desc">{p.desc}</div>
              <div className="pc-tags" style={{gridColumn: '1 / -1'}}>
                {p.tags.map(t => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Science section ---------- */
const FACTS = [
  {
    icon: '∞',
    title: 'Infinity',
    body: 'Some infinities are bigger than others. The infinite decimals between 0 and 1 are MORE infinite than all the whole numbers!',
  },
  {
    icon: '🌀',
    title: 'Fractals',
    body: 'The Mandelbrot set has infinite detail — zoom in forever and you\'ll always find more complexity hiding inside.',
  },
  {
    icon: '⬛',
    title: 'Tesseracts',
    body: 'A tesseract is a 4D cube — just like a cube is made of squares, a tesseract is made of cubes. You can\'t hold one, but you can spin it.',
  },
  {
    icon: '🪐',
    title: 'Saturn\'s Rings',
    body: 'Saturn\'s rings stretch 282,000 km wide but are only ~10 metres thick. A perfect, impossible object.',
  },
  {
    icon: '🧮',
    title: 'Prime Numbers',
    body: 'Primes go on forever — infinitely many of them — and no one fully understands their mysterious pattern.',
  },
  {
    icon: '🔭',
    title: 'Black Holes',
    body: 'At the centre of a black hole, our equations break down. Physics stops working — which means there\'s still so much to discover.',
  },
];

function ScienceSection({ paletteName }) {
  return (
    <section className="sec" id="science">
      <SectionHead
        index="§ 03 · MATH & SCIENCE"
        title={<>How the universe <em>works</em>.</>}
        juliaC={[0.285, 0.01]}
        cLabel="0.285 + 0.010i"
        paletteName={paletteName}
        lede="Math isn't just numbers — it's the language of patterns, infinity, and the universe. I love fractals, the mysteries of outer space, and the fact that some infinities are bigger than others."
        ledeAlt="My favourite number is probably 1/0. Don't tell my maths teacher."
      />
      <div className="science-fractal-wrap">
        <div className="science-hint">Click to zoom in · Right-click to zoom out · Double-click to reset</div>
        <HeroMandelbrot paletteName={paletteName} showCoords={true} />
      </div>
      <div className="facts-grid">
        {FACTS.map(f => (
          <div className="fact-card" key={f.title}>
            <div className="fact-icon">{f.icon}</div>
            <div className="fact-title">{f.title}</div>
            <div className="fact-body">{f.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Books & Movies ---------- */
const BOOKS = [
  { title: 'Dog Man', author: 'Dav Pilkey', tag: 'Graphic Novel', rating: 5, quote: 'Justice has a wet nose.', image: 'assets/images/dog-man.jpg' },
  { title: 'Cat Kid Comic Club', author: 'Dav Pilkey', tag: 'Graphic Novel', rating: 5, quote: 'Make comics, change the world.', image: 'assets/images/cat-kid.jpg' },
  { title: 'Harry Potter', author: 'J.K. Rowling', tag: 'Fantasy', rating: 5, quote: 'I want to go to Hogwarts.', image: 'assets/images/harry-potter.jpg' },
];

const MOVIES = [
  { title: 'Zootopia', year: 2016, quote: 'Anyone can be anything.', rating: 5, image: 'assets/images/zootopia.jpg' },
  { title: 'How to Train Your Dragon', year: 2010, quote: 'Toothless is the best.', rating: 5, image: 'assets/images/httyd.jpg' },
  { title: 'Moana', year: 2016, quote: 'The ocean chose her.', rating: 5, image: 'assets/images/moana.jpg' },
  { title: 'WALL·E', year: 2008, quote: 'A love story across the stars.', rating: 5, image: 'assets/images/wall-e.jpg' },
];

function Stars({ n }) {
  return <span className="media-rating">{'★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5-n)}</span>;
}

function MediaCard({ item, kind, index }) {
  // Pre-mapped rgba tints — avoids color-mix() for broad browser compat
  const tints = [
    'rgba(154,123,255,0.18)',
    'rgba(34,232,212,0.18)',
    'rgba(255,212,71,0.18)',
    'rgba(255,95,162,0.18)',
  ];
  const fgColors = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)'];
  const bgColor = fgColors[index % fgColors.length];
  const tint = tints[index % tints.length];
  return (
    <div className="media-card">
      <div className={"media-art " + kind} style={item.image ? {} : { background: tint }}>
        {item.image ? (
          <img src={item.image} alt={item.title} />
        ) : (
          <div className="media-placeholder">
            <span className="ph-mono">{kind === 'book' ? 'BOOK' : 'FILM'} · {String(index+1).padStart(2,'0')}</span>
            <div className="ph-title" style={{color: bgColor}}>{item.title}</div>
          </div>
        )}
        {item.rating === 5 && <div className="tag-ribbon">★ FAV</div>}
      </div>
      <div className="media-meta">
        <span className="media-title">{item.title}</span>
        <span className="media-sub">{kind === 'book' ? item.author : item.year}</span>
      </div>
      <div className="media-quote">"{item.quote}"</div>
      <Stars n={item.rating} />
    </div>
  );
}

function BooksSection({ paletteName }) {
  return (
    <section className="sec" id="books">
      <SectionHead
        index="§ 04 · BOOKS"
        title={<>Portals made of <em>paper</em>.</>}
        juliaC={[0.285, 0.01]}
        cLabel="0.285 + 0.010i"
        paletteName={paletteName}
        lede="Whether it's Dog Man's ridiculous heroism or the first time you walk through the doors of Hogwarts — a good book is a door. Here are some I've loved."
      />
      <div className="media-grid-3">
        {BOOKS.map((b, i) => <MediaCard key={b.title} item={b} kind="book" paletteName={paletteName} index={i} />)}
      </div>
    </section>
  );
}

function MoviesSection({ paletteName }) {
  return (
    <section className="sec" id="movies">
      <SectionHead
        index="§ 05 · MOVIES"
        title={<>Stories at <em>24 fps</em>.</>}
        juliaC={[-0.7269, 0.1889]}
        cLabel="−0.727 + 0.189i"
        paletteName={paletteName}
        lede="Great animated films have incredible music, impossible worlds, and characters that make you feel things. These are some of my all-time favourites."
      />
      <div className="media-grid">
        {MOVIES.map((m, i) => <MediaCard key={m.title} item={m} kind="movie" paletteName={paletteName} index={i} />)}
      </div>
    </section>
  );
}

Object.assign(window, { SectionHead, Chip, CodingSection, ScienceSection, BooksSection, MoviesSection });
