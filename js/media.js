// Loads music and code manifests from the same origin (served via CloudFront)
// and renders the audio player cards + syntax-highlighted code viewer.

(function () {

  // ── Music Player ──────────────────────────────────────────────────────────

  async function loadMusic() {
    const container = document.getElementById('music-player-container');
    if (!container) return;

    let manifest;
    try {
      const res = await fetch('music/manifest.json');
      manifest = await res.json();
    } catch (e) {
      container.innerHTML = '<p class="media-error">Compositions coming soon — check back later!</p>';
      return;
    }

    if (!manifest.tracks || manifest.tracks.length === 0) {
      container.innerHTML = '<p class="media-note">No compositions uploaded yet — stay tuned!</p>';
      return;
    }

    container.innerHTML = '';
    for (const track of manifest.tracks) {
      const card = document.createElement('div');
      card.className = 'audio-card';
      card.innerHTML = `
        <div class="audio-header">
          <span class="audio-icon">🎵</span>
          <div class="audio-info">
            <div class="audio-title">${escHtml(track.title)}</div>
            ${track.description ? `<div class="audio-desc">${escHtml(track.description)}</div>` : ''}
          </div>
        </div>
        <audio controls preload="none">
          <source src="${escHtml(track.file)}" type="audio/mpeg">
          Your browser does not support audio playback.
        </audio>`;
      container.appendChild(card);
    }
  }

  // ── Code Viewer ───────────────────────────────────────────────────────────

  async function loadCode() {
    const listEl   = document.getElementById('code-script-list');
    const viewerEl = document.getElementById('code-viewer');
    const titleEl  = document.getElementById('code-viewer-title');
    const preEl    = document.getElementById('code-viewer-pre');
    const codeEl   = document.getElementById('code-viewer-code');
    const dlBtn    = document.getElementById('code-download-btn');

    if (!listEl) return;

    let manifest;
    try {
      const res = await fetch('code/manifest.json');
      manifest = await res.json();
    } catch (e) {
      listEl.innerHTML = '<p class="media-error">Scripts coming soon — check back later!</p>';
      return;
    }

    if (!manifest.scripts || manifest.scripts.length === 0) {
      listEl.innerHTML = '<p class="media-note">No scripts uploaded yet — stay tuned!</p>';
      return;
    }

    listEl.innerHTML = '';
    for (const script of manifest.scripts) {
      const btn = document.createElement('button');
      btn.className = 'script-btn';
      btn.textContent = script.title;
      btn.setAttribute('data-file', script.file);
      btn.setAttribute('data-title', script.title);
      btn.addEventListener('click', () => loadScript(script, btn));
      listEl.appendChild(btn);
    }

    // Auto-load first script
    if (manifest.scripts.length > 0) {
      loadScript(manifest.scripts[0], listEl.querySelector('.script-btn'));
    }
  }

  async function loadScript(script, btn) {
    const viewerEl = document.getElementById('code-viewer');
    const titleEl  = document.getElementById('code-viewer-title');
    const codeEl   = document.getElementById('code-viewer-code');
    const dlBtn    = document.getElementById('code-download-btn');

    // Highlight active button
    document.querySelectorAll('.script-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    titleEl.textContent = script.title;
    codeEl.textContent  = 'Loading…';
    viewerEl.style.display = 'block';

    let code;
    try {
      const res = await fetch(script.file);
      code = await res.text();
    } catch (e) {
      codeEl.textContent = '# Could not load script. Please try again later.';
      return;
    }

    codeEl.textContent = code;

    // Syntax highlight with Prism (loaded from CDN in HTML)
    if (window.Prism) {
      Prism.highlightElement(codeEl);
    }

    dlBtn.href     = script.file;
    dlBtn.download = script.file.split('/').pop();
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadMusic(); loadCode(); });
  } else {
    loadMusic();
    loadCode();
  }

})();
