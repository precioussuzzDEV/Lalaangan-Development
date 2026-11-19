/* ==========================================================================
   Lalaangan — background music (playlist across the whole app)
   - Plays the tracks in TRACKS in order (no shuffle), then loops back to the first.
   - Always starts from the first track when the app opens, and keeps playing
     without a break when you move between screens.
   - Follows the "Music" volume slider in Settings (0 = off).
   - Browsers block sound until the first tap, so it starts on the first tap.
   To add a track: put the mp3 in audio/ and add its filename to TRACKS.
   ========================================================================== */
(function () {
  /* The screens run inside the outer page (index.html), which owns the music.
     In a screen this script only passes taps and Settings changes up to it. */
  if (window.top !== window.self) {
    var toApp = function (msg) {
      msg.source = 'lalaangan-music';
      try { window.top.postMessage(msg, '*'); } catch (e) {}
    };
    /* browsers only allow sound after a tap, and taps inside the frame
       don't reach the outer page by themselves */
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, function () { toApp({ type: 'gesture' }); }, true);
    });
    document.addEventListener('lalaangan:settings', function (e) {
      if (e.detail && e.detail.key === 'musicVolume') toApp({ type: 'settings' });
    });

    /* Change screen through the outer page, which keeps the old screen on
       display until the new one is ready (no flash). minMs = time to wait,
       e.g. for a slide-out animation. */
    window.Lalaangan = window.Lalaangan || {};
    window.Lalaangan.goTo = function (url, minMs) {
      var full;
      try { full = new URL(url, location.href).href; } catch (e) { location.href = url; return; }
      toApp({ type: 'navigate', url: full, minMs: minMs || 0 });
    };
    /* plain links between screens go the same way */
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var a = event.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (e) { return; }
      if (u.protocol !== location.protocol || u.host !== location.host) return;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return; /* in-page link */
      event.preventDefault();
      window.Lalaangan.goTo(u.href, 0);
    });
    return;
  }

  /* Played in this order, then it starts again from the top */
  var TRACKS = [
    'step-into-sabahan-wonders.mp3',
    'tangkap-ketam-di-hutan-bakau.mp3',
    'jalan-jalan-di-tamu-migguan.mp3',
    'bersantai-kau-di-sabah.mp3',
    'down-to-nostalgic-road.mp3',
    'slow-sunset.mp3'
  ];
  var FOLDER = 'audio/';
  var DEFAULT_VOLUME = 0.35;  /* used until the player moves the Music slider */
  var FADE_IN_MS = 1500;

  var SETTINGS_KEY = 'lalaangan.settings';

  var audio = new Audio();
  audio.preload = 'auto';
  audio.volume = 0;

  var pos = 0;        /* which track in TRACKS is playing (always starts at 0) */
  var fadeTimer = null;
  var waitingForTap = false;

  /* ---------- settings + saved state (safe if storage is blocked) ---------- */
  /* Loudness from the Settings slider (0 to 100), as 0 to 1. 0 = off. */
  function musicVolume() {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (s) {
        if (s.musicVolume != null) return Math.max(0, Math.min(100, Number(s.musicVolume) || 0)) / 100;
        if (s.music === false) return 0;   /* old on/off setting */
      }
    } catch (e) {}
    return DEFAULT_VOLUME;
  }
  function musicOn() { return musicVolume() > 0; }

  /* ---------- playback (no shuffle: TRACKS in order, then back to the first) ---------- */
  function fadeIn() {
    clearInterval(fadeTimer);
    var start = Date.now();
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (Date.now() - start) / FADE_IN_MS);
      audio.volume = musicVolume() * k;
      if (k >= 1) clearInterval(fadeTimer);
    }, 50);
  }

  function loadTrack() {
    audio.src = FOLDER + TRACKS[pos];
  }

  function nextTrack() {
    pos = (pos + 1) % TRACKS.length;
    loadTrack();
    if (musicOn()) start();
  }

  /* quiet = true: jump straight to full volume (used when carrying on from the
     previous page, so changing screens doesn't fade the music in again) */
  function start(quiet) {
    if (!musicOn()) return;
    audio.volume = quiet ? musicVolume() : 0;
    var p = audio.play();
    if (p && p.catch) {
      p.then(function () { if (!quiet) fadeIn(); })
       .catch(function () { audio.volume = 0; waitForTap(); });
    }
  }

  /* Browsers block sound until the player taps something */
  function waitForTap() {
    if (waitingForTap) return;
    waitingForTap = true;
    function go() {
      document.removeEventListener('pointerdown', go, true);
      document.removeEventListener('keydown', go, true);
      waitingForTap = false;
      start();
    }
    document.addEventListener('pointerdown', go, true);
    document.addEventListener('keydown', go, true);
  }

  function stop() {
    clearInterval(fadeTimer);
    audio.pause();
  }

  /* ---------- reacting to Settings and the page ---------- */
  /* The Music slider moved: change the loudness right away (no fade), and
     start or stop the music when it goes up from or down to 0 */
  function applySetting() {
    if (!musicOn()) { stop(); return; }
    clearInterval(fadeTimer);
    if (audio.paused) start(true); else audio.volume = musicVolume();
  }
  document.addEventListener('lalaangan:settings', function (e) {
    if (e.detail && e.detail.key === 'musicVolume') applySetting();
  });
  window.addEventListener('storage', function (e) {
    if (e.key === SETTINGS_KEY) applySetting();
  });

  /* Messages from the screens in the frame */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'lalaangan-music' || e.origin !== location.origin) return;
    if (d.type === 'gesture' && waitingForTap) {
      waitingForTap = false;
      start();
    } else if (d.type === 'settings') {
      applySetting();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) audio.pause();
    else if (musicOn()) start(true);
  });

  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('error', function () {
    /* a missing or broken file: skip to the next one, but don't loop forever */
    if (TRACKS.length > 1 && (audio._errors = (audio._errors || 0) + 1) < TRACKS.length) nextTrack();
  });
  audio.addEventListener('playing', function () { audio._errors = 0; });

  /* ---------- start up: always from the first track ----------
     This outer page never reloads when you change screen, so the music just
     keeps going; nothing needs saving. */
  try { localStorage.removeItem('lalaangan.music'); } catch (e) {}  /* old saved position */
  loadTrack();
  if (musicOn()) start();

  window.Lalaangan = window.Lalaangan || {};
  window.Lalaangan.musicNext = nextTrack;
})();
