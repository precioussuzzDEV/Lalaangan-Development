/* ==========================================================================
   Lalaangan — slide between screens
   Add data-tab="..." to any nav button/link, data-page="..." to <body>, and
   data-slide to the element that should slide (the nav bar stays put).
   To add a new screen: add its file to PAGES below.
   ========================================================================== */
(function () {
  /* Left-to-right order of the tabs. Going to a later tab slides left. */
  var ORDER = ['home', 'collection', 'map', 'quests', 'profile'];

  /* Tabs that already have a page. Others are ignored until you add them. */
  var PAGES = {
    home:       'home.html#home',
    collection: 'collection.html',
    map:        'map.html',
    quests:     'quests.html',
    profile:    'profile.html'
  };

  var SLIDE_MS = 260;   /* keep in sync with --slide-duration in slide.css */

  var current = document.body.dataset.page;
  var slider = document.querySelector('[data-slide]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Arriving: slide in from the side we were sent from */
  var dir = null;
  try {
    dir = sessionStorage.getItem('navDir');
    sessionStorage.removeItem('navDir');
  } catch (e) { /* storage blocked: just no slide-in */ }

  /* Inside the outer page the new screen loads hidden, so wait for the
     "reveal" message before sliding in (otherwise the slide plays unseen). */
  var framed = window.top !== window.self;
  if (dir && slider && !reduceMotion) {
    var slideIn = function () {
      slider.style.visibility = '';
      slider.classList.add('slide-in-' + dir);
    };
    if (framed) {
      slider.style.visibility = 'hidden';
      var revealed = false;
      var reveal = function () { if (!revealed) { revealed = true; slideIn(); } };
      window.addEventListener('message', function (e) {
        var d = e.data;
        if (d && d.source === 'lalaangan-music' && d.type === 'reveal') reveal();
      });
      setTimeout(reveal, 1500); /* safety: never leave the screen hidden */
    } else {
      slideIn();
    }
  }

  /* Leaving: slide out, then load the next page */
  function slideTo(tab) {
    if (tab === current || !PAGES[tab]) return;

    var direction = ORDER.indexOf(tab) > ORDER.indexOf(current) ? 'next' : 'prev';
    try { sessionStorage.setItem('navDir', direction); } catch (e) {}

    var viaApp = framed && window.Lalaangan && window.Lalaangan.goTo;
    if (slider && !reduceMotion) {
      slider.classList.remove('slide-in-next', 'slide-in-prev');
      slider.classList.add('slide-out-' + direction);
      /* the outer page loads the next screen while this one slides out */
      if (viaApp) window.Lalaangan.goTo(PAGES[tab], SLIDE_MS);
      else setTimeout(function () { window.location.href = PAGES[tab]; }, SLIDE_MS);
    } else if (viaApp) {
      window.Lalaangan.goTo(PAGES[tab], 0);
    } else {
      window.location.href = PAGES[tab];
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-tab]');
    if (!link) return;
    event.preventDefault();
    slideTo(link.dataset.tab);
  });

  /* Back button can restore a page mid-slide: reset it */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && slider) {
      slider.classList.remove('slide-out-next', 'slide-out-prev');
    }
  });
})();
