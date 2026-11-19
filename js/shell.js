/* ==========================================================================
   Lalaangan — outer page: swaps screens without a flash
   The new screen loads in a hidden frame on top of the old one. Only when it
   is ready (and the slide-out has finished) is it shown and the old one removed.
   Screens ask for a change with Lalaangan.goTo(url) (see js/music.js).
   ========================================================================== */
(function () {
  var frame = document.getElementById('app');
  var pending = null;   /* the frame that is still loading, if any */

  function sameApp(href) {
    try {
      var u = new URL(href, location.href);
      return u.protocol === location.protocol && u.host === location.host;
    } catch (e) { return false; }
  }

  function goTo(url, minMs) {
    if (!sameApp(url)) return;
    if (pending) { pending.remove(); pending = null; }

    var next = document.createElement('iframe');
    next.className = 'app-frame is-loading';
    next.title = 'Lalaangan';
    next.setAttribute('allow', frame.getAttribute('allow') || '');
    var started = Date.now();
    pending = next;

    next.addEventListener('load', function () {
      if (pending !== next) return;
      /* let the old screen finish sliding out first */
      var wait = Math.max(0, (minMs || 0) - (Date.now() - started));
      setTimeout(function () {
        if (pending !== next) return;
        pending = null;
        var old = frame;
        next.classList.remove('is-loading');
        next.id = 'app';
        frame = next;
        old.remove();
        try { next.contentWindow.postMessage({ source: 'lalaangan-music', type: 'reveal' }, '*'); } catch (e) {}
      }, wait);
    });

    next.src = url;
    document.body.insertBefore(next, frame.nextSibling);
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'lalaangan-music' || e.origin !== location.origin) return;
    if (d.type === 'navigate' && typeof d.url === 'string') goTo(d.url, Number(d.minMs) || 0);
  });
})();
