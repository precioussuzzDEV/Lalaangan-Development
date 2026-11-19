/* =========================================================
   creature-tap.js â€” tap reactions + custom emotes for a PNG
   Lalaangan â€¢ Prototype 1

   Usage:
     <link rel="stylesheet" href="creature-tap.css">
     <img id="creature" src="creature.png" alt="Creature">
     <script src="creature-tap.js"></script>
     <script>
       const pet = CreatureTap.attach(document.getElementById('creature'), {
         onReact: (name) => console.log('reaction:', name)
       });
       // pet.play('love')   pet.emote('leaf')   pet.sleep()   pet.wake()
     </script>

   Emotes: heart, sparkle, anger, leaf

   Gestures:
     tap            â†’ random: heart bounce / sparkle squish / leaf sway (skew)
     long-press     â†’ "love": pulse + heart burst
     5 fast taps    â†’ "annoyed": angry vibrate + anger mark + phone buzz
     no taps 10s    â†’ dozes off (slow sway). Tap to wake â†’ sparkle.

   Game events (call from your own code):
     pet.play('stepGoal')     big jump + sparkle fountain â€” daily step goal reached
       (alternatives to compare: 'stepGoalHops', 'stepGoalGlow')
     pet.play('greenAction')  leaf burst    â€” SDG 11 / eco task done
   Show just a bubble with pet.emote('leaf').
   ========================================================= */
(function (global) {
  'use strict';

  /* ---------- built-in emote icons (animated SVG, 40Ã—40) ----------
     Every emote moves on its own (beat, twinkle, dripâ€¦). Animations live
     in creature-tap.css under "emote internals" (classes start with ct-e-). */
  const O = 'stroke="#3b2410" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';   // navy outline, matches the creature's line art
  const EMOTES = {
    heart:   '<svg viewBox="0 0 40 40"><defs><linearGradient id="ctg-heart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb3d1"/><stop offset=".55" stop-color="#ff86b4"/><stop offset="1" stop-color="#b98cff"/></linearGradient></defs><g class="ct-e-beat"><path d="M20 34C8 26 3 19 3 12.5 3 7.5 7 4 11.5 4c3.6 0 6.6 2.2 8.5 5.2C21.9 6.2 24.9 4 28.5 4 33 4 37 7.5 37 12.5 37 19 32 26 20 34Z" fill="url(#ctg-heart)" ' + O + '/><path d="M8 11.5c.5-2.6 2.4-4 4.6-3.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/><circle cx="9" cy="15.5" r="1.2" fill="#fff" opacity=".8"/></g></svg>',
    sparkle: '<svg viewBox="0 0 40 40"><defs><radialGradient id="ctg-spark" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffc6e6"/></radialGradient></defs><path class="ct-e-twinkle" d="M17 3l3.2 11.8L32 18l-11.8 3.2L17 33l-3.2-11.8L2 18l11.8-3.2Z" fill="url(#ctg-spark)" ' + O + '/><path class="ct-e-twinkle" style="animation-delay:.45s" d="M32 23.5l1.7 4.6 4.3 1.7-4.3 1.7L32 36l-1.7-4.5-4.3-1.7 4.3-1.7Z" fill="#bfe9ff" stroke="#3b2410" stroke-width="1.8" stroke-linejoin="round"/><circle class="ct-e-twinkle" style="animation-delay:.8s" cx="31" cy="7" r="2.2" fill="#d9c4ff" stroke="#3b2410" stroke-width="1.5"/></svg>',
    anger:   '<svg viewBox="0 0 40 40"><g class="ct-e-throb" fill="none" stroke-linecap="round"><g stroke="#3b2410" stroke-width="7.5"><path d="M6 15q9 0 9-9"/><path d="M25 6q0 9 9 9"/><path d="M34 25q-9 0-9 9"/><path d="M15 34q0-9-9-9"/></g><g stroke="#ff6f9f" stroke-width="4"><path d="M6 15q9 0 9-9"/><path d="M25 6q0 9 9 9"/><path d="M34 25q-9 0-9 9"/><path d="M15 34q0-9-9-9"/></g></g></svg>',
    leaf:    '<svg viewBox="0 0 40 40"><defs><linearGradient id="ctg-leaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7fe0c4"/><stop offset=".6" stop-color="#a8f0d0"/><stop offset="1" stop-color="#bfe9ff"/></linearGradient></defs><g class="ct-e-tilt"><path d="M6 34C6 16 18 6 35 5c0 18-11 29-29 29Z" fill="url(#ctg-leaf)" ' + O + '/><path d="M6 34L27 13M15 25l-1-6M20 20l-.5-6M15 25l6 .5M20 20l6 .5" fill="none" stroke="#3b2410" stroke-width="1.9" stroke-linecap="round"/><path d="M22 9.5c3-1.4 6-2 8.5-2.2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/></g></svg>'
  };

  /* ---------- reactions: body animation + emote (+ optional particle burst) ---------- */
  const REACTIONS = {
    // random tap reactions
    happy:   { anim: 'bounce', emote: 'heart' },
    sparkly: { anim: 'squish', emote: 'sparkle' },
    leafy:   { anim: 'sway',   emote: 'leaf' },
    // gestures
    love:    { anim: 'love',   emote: 'heart',   burst: 'heart' },    // long-press
    annoyed: { anim: 'vibrate', emote: 'anger', haptic: [60, 40, 60, 40, 120] },  // 5 fast taps: angry shiver + phone buzz
    // game events â€” call pet.play('stepGoal') etc. from your game code
    // stepGoal â€” three styles to compare (keep the one you like)
    stepGoal:     { anim: 'jump', emote: 'sparkle', burst: 'sparkle', burstMode: 'fountain', burstCount: 9, burstDelay: 380 },  // A: big jump
    stepGoalHops: { anim: 'hops', emote: 'heart',   burst: 'sparkle', burstMode: 'ring',     burstCount: 10, burstDelay: 950 },  // B: victory hops
    stepGoalGlow: { anim: 'glow', emote: 'sparkle', burst: 'sparkle', burstMode: 'ring',     burstCount: 12, burstDelay: 800 },  // C: power-up glow
    greenAction: { anim: 'squish', emote: 'leaf',    burst: 'leaf' }
  };

  const DEFAULTS = {
    tapPool: ['happy', 'sparkly', 'leafy'],
    longPressMs: 550,
    comboTaps: 5,          // taps within comboWindowMs â†’ annoyed
    comboWindowMs: 1600,
    sleepAfterMs: 10000,   // 0 to disable sleeping
    haptics: true,
    emotes: {},            // override/add emotes: { heart: 'img/emote-heart.png' } or SVG string
    reactions: {},         // override/add reactions: { wave: { anim:'wiggle', emote:'leaf', ms:700 } }
    onReact: null          // callback(name)
  };

  function attach(img, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});
    const emotes = Object.assign({}, EMOTES, opts.emotes);
    const reactions = Object.assign({}, REACTIONS, opts.reactions);

    /* build wrappers: stage > react > body > img */
    const stage = document.createElement('div');
    const react = document.createElement('div');
    const body = document.createElement('div');
    const shadow = document.createElement('div');
    stage.className = 'ct-stage';
    react.className = 'ct-react';
    body.className = 'ct-body';
    shadow.className = 'ct-shadow';
    stage.setAttribute('role', 'button');
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('aria-label', (img.alt || 'Creature') + ' â€” tap to interact');

    // keep the size the <img> had
    const w = img.getAttribute('width') || img.style.width;
    if (w) stage.style.width = isNaN(w) ? w : w + 'px';

    img.parentNode.insertBefore(stage, img);
    body.appendChild(img);
    react.appendChild(body);
    stage.appendChild(shadow);
    stage.appendChild(react);
    img.draggable = false;

    let currentEmote = null;
    let pressTimer = null;
    let longFired = false;
    let tapTimes = [];
    let sleepTimer = null;
    let sleeping = false;
    let lastPick = null;

    /* ---- helpers ---- */
    function iconHTML(name) {
      const src = emotes[name];
      if (!src) return '';
      return src.trim().startsWith('<') ? src : '<img src="' + src + '" alt="">';
    }

    function buzz(ms) {
      if (opts.haptics && navigator.vibrate) navigator.vibrate(ms || 12);
    }

    function playAnim(anim) {
      react.className = 'ct-react';
      void react.offsetWidth;            // restart animation even mid-play
      react.classList.add('anim-' + anim);
    }

    function emote(name, sticky) {
      if (currentEmote) currentEmote.remove();
      const el = document.createElement('div');
      el.className = 'ct-emote' + (sticky ? ' is-sticky' : '');
      el.innerHTML = '<div class="ct-emote-bubble">' + iconHTML(name) + '</div>';
      stage.appendChild(el);
      currentEmote = el;
      if (!sticky) {
        el.addEventListener('animationend', function (e) {
          if (e.animationName === 'ct-emote-pop') {
            el.remove();
            if (currentEmote === el) currentEmote = null;
          }
        });
      }
      return el;
    }

    function burst(name, count, mode) {
      count = count || 7;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'ct-particle';
        let deg, dist = 90 + Math.random() * 70;          // dist in % of particle size
        if (mode === 'ring') {                            // all the way around
          deg = i * 360 / count;
        } else if (mode === 'fountain') {                 // tall spray straight up
          deg = -90 + (i - (count - 1) / 2) * (70 / count) + (Math.random() * 10 - 5);
          dist = 120 + Math.random() * 90;
        } else {                                          // default upward fan
          deg = -90 + (i - (count - 1) / 2) * (150 / count);
        }
        const angle = deg * Math.PI / 180;
        p.style.setProperty('--dx', Math.cos(angle) * dist * 3 + '%');
        p.style.setProperty('--dy', Math.sin(angle) * dist * 3 + '%');
        p.style.setProperty('--s', (0.7 + Math.random() * 0.6).toFixed(2));
        p.style.setProperty('--r', (Math.random() * 120 - 60).toFixed(0) + 'deg');
        p.style.setProperty('--life', (0.8 + Math.random() * 0.4).toFixed(2) + 's');
        p.innerHTML = iconHTML(name).replace('<img', '<img style="width:100%"');
        stage.appendChild(p);
        p.addEventListener('animationend', function () { p.remove(); });
      }
    }

    function ring(x, y) {
      const r = document.createElement('div');
      r.className = 'ct-ring';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      stage.appendChild(r);
      r.addEventListener('animationend', function () { r.remove(); });
    }

    /* While it is angry (5 fast taps), ignore taps until the angry animation is done */
    let angry = false;
    let angryTimer = null;
    function calmDown() {
      angry = false;
      clearTimeout(angryTimer);
      react.removeEventListener('animationend', onAngryEnd);
    }
    function onAngryEnd(e) { if (e.animationName === 'ct-vibrate') calmDown(); }

    function play(name) {
      const r = reactions[name];
      if (!r) return;
      if (r.anim === 'vibrate') {
        angry = true;
        react.addEventListener('animationend', onAngryEnd);
        clearTimeout(angryTimer);
        angryTimer = setTimeout(calmDown, 1200);   /* safety net if the animation never reports its end */
      }
      if (sleeping) wake(true);
      playAnim(r.anim);
      if (r.emote) emote(r.emote);
      if (r.burst) setTimeout(function () { burst(r.burst, r.burstCount, r.burstMode); }, r.burstDelay || 0);
      buzz(r.haptic || (['love','jump','hops','glow'].indexOf(r.anim) > -1 ? [15, 40, 15] : 12));
      resetSleep();
      if (typeof opts.onReact === 'function') opts.onReact(name);
    }

    function randomTap() {
      const pool = opts.tapPool.filter(function (n) { return n !== lastPick; });
      const pick = pool[Math.floor(Math.random() * pool.length)];
      lastPick = pick;
      play(pick);
    }

    /* ---- sleep / wake ---- */
    function sleep() {
      sleeping = true;
      stage.classList.add('is-sleeping');
    }
    function wake(silent) {
      sleeping = false;
      stage.classList.remove('is-sleeping');
      if (currentEmote) { currentEmote.remove(); currentEmote = null; }
      if (!silent) {
        playAnim('bounce');
        emote('sparkle');
        buzz(12);
        if (typeof opts.onReact === 'function') opts.onReact('wake');
      }
      resetSleep();
    }
    function resetSleep() {
      clearTimeout(sleepTimer);
      if (opts.sleepAfterMs > 0) sleepTimer = setTimeout(sleep, opts.sleepAfterMs);
    }

    /* ---- gestures ---- */
    function onDown(e) {
      if (angry) return;
      longFired = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        longFired = true;
        play('love');
      }, opts.longPressMs);

      const rect = stage.getBoundingClientRect();
      ring(e.clientX - rect.left, e.clientY - rect.top);
    }

    function onUp() {
      clearTimeout(pressTimer);
      if (angry || longFired) return;

      if (sleeping) { wake(); return; }

      const now = Date.now();
      tapTimes = tapTimes.filter(function (t) { return now - t < opts.comboWindowMs; });
      tapTimes.push(now);
      if (tapTimes.length >= opts.comboTaps) {
        tapTimes = [];
        play('annoyed');
        return;
      }
      randomTap();
    }

    function onCancel() { clearTimeout(pressTimer); }

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointerleave', onCancel);
    stage.addEventListener('pointercancel', onCancel);
    stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (angry) return; sleeping ? wake() : randomTap(); }
    });

    resetSleep();

    /* public controls */
    return {
      element: stage,
      play: play,
      emote: function (name) { emote(name); },
      burst: burst,
      sleep: sleep,
      wake: function () { wake(); },
      destroy: function () {
        clearTimeout(sleepTimer);
        clearTimeout(pressTimer);
        stage.parentNode.insertBefore(img, stage);
        stage.remove();
      }
    };
  }

  global.CreatureTap = { attach: attach, EMOTES: EMOTES, REACTIONS: REACTIONS };
})(window);

