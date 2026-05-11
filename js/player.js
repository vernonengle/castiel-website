/* Music player — loads real tracks from music/manifest.json */

function formatTime(s) {
  if (!s || !isFinite(s)) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

function Waveform({ seed, progress }) {
  const canvasRef = React.useRef(null);

  const draw = React.useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = c.getBoundingClientRect();
    if (!rect.width) return;
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const bars = 120;
    const bw = rect.width / bars;
    const style = getComputedStyle(document.body);
    const accent = style.getPropertyValue('--accent').trim() || '#9a7bff';
    const dim = style.getPropertyValue('--ink-faint').trim() || '#5d5585';
    for (let i = 0; i < bars; i++) {
      const s = Math.sin(i * 0.37 + seed * 3.1) * 0.5 + Math.sin(i * 0.11 + seed) * 0.5;
      const amp = (Math.abs(s) * 0.7 + 0.15) * rect.height * 0.85;
      const active = (i / bars) <= progress;
      ctx.fillStyle = active ? accent : dim;
      ctx.globalAlpha = active ? 1 : 0.5;
      ctx.fillRect(i * bw + 1, (rect.height - amp) / 2, bw - 2, amp);
    }
  }, [seed, progress]);

  React.useEffect(draw, [draw]);

  return <canvas ref={canvasRef} style={{width:'100%', height:'100%'}} />;
}

function MusicSection({ paletteName }) {
  const [tracks, setTracks] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [durations, setDurations] = React.useState({});
  const audioRef = React.useRef(null);
  const progressRef = React.useRef(0);

  React.useEffect(() => {
    fetch('music/manifest.json')
      .then(r => r.json())
      .then(data => {
        const ts = data.tracks.map((t, i) => ({
          id: i + 1,
          title: t.title,
          date: t.description || '',
          file: t.file,
        }));
        setTracks(ts);
        if (ts.length > 0) setActiveId(ts[0].id);
      })
      .catch(() => {});
  }, []);

  const track = tracks.find(t => t.id === activeId);

  // Change audio source when track changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = track.file;
    audio.load();
    setProgress(0);
    progressRef.current = 0;
  }, [activeId]);

  // Play / pause
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing, activeId]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const p = audio.currentTime / audio.duration;
    progressRef.current = p;
    setProgress(p);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDurations(prev => ({ ...prev, [activeId]: audio.duration }));
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    progressRef.current = 0;
    if (tracks.length > 1) {
      const i = tracks.findIndex(t => t.id === activeId);
      setActiveId(tracks[(i + 1) % tracks.length].id);
      setPlaying(true);
    }
  };

  const onScrub = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = p * audio.duration;
    setProgress(p);
    progressRef.current = p;
  };

  const prevTrack = () => {
    const i = tracks.findIndex(t => t.id === activeId);
    setActiveId(tracks[(i - 1 + tracks.length) % tracks.length].id);
    setProgress(0);
  };

  const nextTrack = () => {
    const i = tracks.findIndex(t => t.id === activeId);
    setActiveId(tracks[(i + 1) % tracks.length].id);
    setProgress(0);
  };

  const dur = durations[activeId] || 0;
  const currentTime = progress * dur;

  if (!tracks.length) {
    return (
      <section className="sec" id="music">
        <div style={{color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', fontSize: 13}}>Loading compositions…</div>
      </section>
    );
  }

  return (
    <section className="sec" id="music">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <SectionHead
        index="§ 01 · MUSIC"
        title={<>Patterns you can <em>hear</em>.</>}
        juliaC={[-0.123, 0.745]}
        cLabel="−0.123 + 0.745i"
        paletteName={paletteName}
        lede="I play drums and piano, and I compose with MuseScore. Every piece here is something I wrote. Most of them started as a pattern I couldn't get out of my head."
      />

      <div className="player">
        <div className="player-left">
          <AlbumArt paletteName={paletteName} seed={activeId || 1} />
          <div className="track-label">ALBUM · Infinities</div>
        </div>
        <div className="player-right">
          <div className="now-playing">Now playing · composition</div>
          <h3 className="track-title">{track?.title || '—'}</h3>
          <div className="track-meta">
            <span>{track?.date}</span>
            {dur > 0 && <><span>·</span><span>{formatTime(dur)}</span></>}
          </div>

          <div className="waveform" onClick={onScrub}>
            <Waveform seed={activeId || 1} progress={progress} />
            <div className="playhead" style={{ left: `${progress * 100}%` }} />
          </div>

          <div className="player-controls">
            <button className="ctrl" onClick={prevTrack}>⏮</button>
            <button className="play-btn" onClick={() => setPlaying(p => !p)}>
              {playing ? '❚❚' : '▶'}
            </button>
            <button className="ctrl" onClick={nextTrack}>⏭</button>
            <div className="time">{formatTime(currentTime)} / {formatTime(dur)}</div>
          </div>
        </div>
      </div>

      <div className="tracklist">
        {tracks.map((t, i) => (
          <div
            key={t.id}
            className={"track-row" + (t.id === activeId ? ' active' : '')}
            onClick={() => { setActiveId(t.id); setPlaying(true); }}
          >
            <div className="num">
              {t.id === activeId && playing ? (
                <span className="eq">
                  <span className="eq-bar"/>
                  <span className="eq-bar"/>
                  <span className="eq-bar"/>
                </span>
              ) : String(i+1).padStart(2,'0')}
            </div>
            <div className="t-name">{t.title}</div>
            <div className="t-date">{t.date}</div>
            <div className="t-dur">{durations[t.id] ? formatTime(durations[t.id]) : '—'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { MusicSection });
