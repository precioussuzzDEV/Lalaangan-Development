/* ==========================================================================
   Lalaangan — sound effects, made in code (no audio files needed)
   Soft, short sounds for buttons. Follows the "Sound FX" volume slider in Settings.
   Plays automatically for any button / link click:
     - normal buttons      -> "tap"    (soft pop)
     - bottom nav tabs     -> "nav"    (lighter, higher blip)
     - claim / gift / etc. -> "reward" (two rising notes)
   To make a button play the reward sound, add class "btn-claim" or "gift",
   or the attribute data-sfx="reward". Other sounds: data-sfx="tap" | "nav" | "back".
   From code: Lalaangan.playSfx("reward");
   Later you can swap any of these for an audio file inside play().
   ========================================================================== */
(function () {
  var SETTINGS_KEY = 'lalaangan.settings';
  var DEFAULT_VOLUME = 0.5;    /* used until the player moves the Sound FX slider */

  var ctx = null;
  var master = null;

  /* Loudness from the Settings slider (0 to 100). Read fresh each time, because
     it can change on another screen. 0 = off. */
  function volume() {
    try {
      var s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (s) {
        if (s.sfxVolume != null) return Math.max(0, Math.min(100, Number(s.sfxVolume) || 0)) / 100;
        if (s.sfx === false) return 0;   /* old on/off setting */
      }
    } catch (e) { /* storage blocked: default */ }
    return DEFAULT_VOLUME;
  }

  /* Browsers only allow audio after a tap, so make it lazily on first click */
  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* One soft note: quick fade in, smooth fade out, optional pitch slide */
  function note(c, freq, start, dur, opts) {
    opts = opts || {};
    var t = c.currentTime + start;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    var vol = opts.vol == null ? 0.18 : opts.vol;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  var SOUNDS = {
    /* soft wooden-ish pop */
    tap:    function (c) { note(c, 640, 0, 0.09, { type: 'triangle', slideTo: 430, vol: 0.2 }); },
    /* lighter blip for the bottom tabs */
    nav:    function (c) { note(c, 760, 0, 0.08, { type: 'sine', slideTo: 900, vol: 0.14 }); },
    /* gentle low note for back / close */
    back:   function (c) { note(c, 440, 0, 0.1, { type: 'triangle', slideTo: 300, vol: 0.16 }); },
    /* cheerful two-note chime for rewards */
    reward: function (c) {
      note(c, 660, 0,    0.22, { type: 'sine', vol: 0.18 });
      note(c, 990, 0.1,  0.34, { type: 'sine', vol: 0.18 });
      note(c, 1320, 0.1, 0.34, { type: 'triangle', vol: 0.05 }); /* small sparkle on top */
    },

    /* ---- creature sounds (Home): played by js/home.js for each tap reaction ---- */
    /* heart: happy little two-note chirp going up ("pi-pii!") */
    'pet-happy': function (c) {
      note(c, 520, 0,    0.12, { type: 'sine', slideTo: 620, vol: 0.2 });
      note(c, 780, 0.11, 0.2,  { type: 'sine', slideTo: 920, vol: 0.2 });
    },
    /* sparkle: quick twinkling run of high bells */
    'pet-sparkly': function (c) {
      [1046, 1318, 1568, 2093].forEach(function (f, i) {
        note(c, f, i * 0.07, 0.22, { type: 'sine', vol: 0.12 });
      });
    },
    /* leaf: soft rustle (filtered noise) with a airy note */
    'pet-leafy': function (c) {
      noise(c, 0, 0.32, 2800, 0.1);
      note(c, 392, 0.04, 0.3, { type: 'triangle', slideTo: 330, vol: 0.1 });
    },
    /* long press: warm, slow "aww" chord */
    'pet-love': function (c) {
      note(c, 392, 0,    0.7, { type: 'sine', vol: 0.14 });
      note(c, 494, 0.05, 0.7, { type: 'sine', vol: 0.12 });
      note(c, 587, 0.1,  0.8, { type: 'sine', vol: 0.12 });
    },
    /* too many taps: grumpy low buzz */
    'pet-annoyed': function (c) {
      note(c, 150, 0,    0.2, { type: 'sawtooth', slideTo: 110, vol: 0.1 });
      note(c, 140, 0.22, 0.2, { type: 'sawtooth', slideTo: 100, vol: 0.1 });
    },
    /* waking up: sleepy rising "hmm?" */
    'pet-wake': function (c) {
      note(c, 300, 0, 0.3, { type: 'sine', slideTo: 520, vol: 0.16 });
    },
    /* daily step goal: little fanfare */
    'pet-goal': function (c) {
      [523, 659, 784, 1046].forEach(function (f, i) {
        note(c, f, i * 0.1, 0.3, { type: 'triangle', vol: 0.16 });
      });
      note(c, 1568, 0.4, 0.6, { type: 'sine', vol: 0.12 });
    }
  };

  /* A short burst of filtered noise (for the leaf rustle) */
  function noise(c, start, dur, freq, vol) {
    var t = c.currentTime + start;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    var gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start(t);
  }

  function play(name) {
    var v = volume();
    if (v <= 0) return;
    var c = getCtx();
    if (!c || !SOUNDS[name]) return;
    master.gain.value = v;
    SOUNDS[name](c);
  }

  /* Pick the right sound for whatever was clicked */
  function soundFor(el) {
    var custom = el.closest('[data-sfx]');
    if (custom && SOUNDS[custom.dataset.sfx]) return custom.dataset.sfx;
    if (el.closest('.btn-claim, .gift')) return 'reward';
    if (el.closest('[data-tab]')) return 'nav';
    return 'tap';
  }

  document.addEventListener('click', function (event) {
    var el = event.target.closest('button, a, [role="button"], summary, label, .tab');
    if (!el || el.disabled) return;
    if (el.classList.contains('ct-stage')) return;   /* the creature plays its own sounds */
    /* Settings switches: skip, or the sound would play before the switch saves */
    if (el.closest('label') && el.closest('label').querySelector('input[data-setting]')) return;
    play(soundFor(el));
  });

  window.Lalaangan = window.Lalaangan || {};
  window.Lalaangan.playSfx = play;
})();
