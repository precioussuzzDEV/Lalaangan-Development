/* Lalaangan · Map screen · Variation B "Community Map"
   - Illustrated night map of Kuala Penyu (placeholder layout, swap in Leaflet + GPS later)
   - Joystick (bottom-left) / WASD / arrow keys move the map; creature stays centred and walks
   - Filter chips: Creatures · Community landmarks (SDG 11) · Health spots (SDG 3)
   - Walk near a pin (or tap it) to open its info sheet; check in for XP
   - Daily quest card: 5,000 steps + visit 3 health spots */
(() => {
  'use strict';

  // Older browsers lack roundRect, which would stop the whole map from drawing
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(Array.isArray(r) ? r[0] : r || 0, w / 2, h / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };
  }

  // ---------- Config ----------
  const W = 2400, H = 2400;
  const SPEED = 150;
  const RADIUS = 70;
  const M_PER_PX = 0.5;
  const STEP_M = 0.75;
  const CAM_Y = 0.42;
  const STEP_GOAL = Lalaangan.getStepGoal(), HEALTH_GOAL = 3; // goal comes from Settings

  const C = {
    sea: '#a8d8e8', wave: 'rgba(255,255,255,0.35)', land: '#f6e7c8', sand: '#f0d9a8',
    park: '#c5e2a8', river: '#9fd0e0', road: '#fffaf0', roadEdge: '#e3cfa8',
    dash: 'rgba(217,130,47,0.4)', bld: '#e9c9a0', bldTop: '#f2d9b4', win: '#fff3c8',
    tree: '#6fae6a', tree2: '#82c07a', wood: '#a67c52', label: 'rgba(74,52,38,0.5)',
  };

  const coastX = y => 620 + 70 * Math.sin(y / 230) + 40 * Math.sin(y / 97);
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // ---------- World drawing (done once) ----------
  function smoothPath(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const l = pts[pts.length - 1];
    g.lineTo(l[0], l[1]);
  }

  function buildWorld() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const r = rng(11);

    g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
    g.strokeStyle = C.wave; g.lineWidth = 2;
    for (let y = 30; y < H; y += 48) {
      g.beginPath();
      for (let x = 0; x < 820; x += 16) {
        const yy = y + Math.sin((x + y) / 38) * 4;
        x ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.stroke();
    }

    // land
    g.beginPath(); g.moveTo(W, 0); g.lineTo(coastX(0), 0);
    for (let y = 0; y <= H; y += 8) g.lineTo(coastX(y), y);
    g.lineTo(W, H); g.closePath();
    g.fillStyle = C.land; g.fill();

    // beach strip
    g.beginPath();
    for (let y = 0; y <= H; y += 8) { const x = coastX(y) + 13; y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = C.sand; g.lineWidth = 28; g.stroke();

    // park
    g.fillStyle = C.park;
    g.beginPath(); g.roundRect(1570, 1300, 440, 360, 40); g.fill();

    // river
    const river = [[2440, 500], [2000, 560], [1750, 720], [1500, 860], [1250, 880], [1000, 850], [760, 905], [520, 900]];
    smoothPath(g, river); g.strokeStyle = C.sand; g.lineWidth = 54; g.stroke();
    smoothPath(g, river); g.strokeStyle = C.river; g.lineWidth = 42; g.stroke();
    smoothPath(g, river); g.strokeStyle = C.wave; g.lineWidth = 2; g.setLineDash([14, 18]); g.stroke(); g.setLineDash([]);

    // buildings
    const blocks = [[800, 1040, 680, 180], [800, 1280, 680, 190], [1540, 1030, 480, 190], [820, 1730, 640, 280], [1540, 1740, 480, 280], [1080, 560, 360, 220]];
    for (const [bx, by, bw, bh] of blocks) {
      for (let x = bx; x < bx + bw - 30; x += 62) {
        for (let y = by; y < by + bh - 30; y += 62) {
          if (r() < 0.22) continue;
          const w = 34 + r() * 20, h = 30 + r() * 20;
          g.fillStyle = C.bld; g.fillRect(x, y, w, h);
          g.fillStyle = C.bldTop; g.fillRect(x + 3, y + 3, w - 6, h * 0.45);
          if (r() < 0.55) { g.fillStyle = C.win; g.globalAlpha = 0.75; g.fillRect(x + 6 + r() * (w - 14), y + h - 12, 4, 5); g.globalAlpha = 1; }
        }
      }
    }
    // clinic (special building)
    g.fillStyle = '#b9d9e6'; g.fillRect(1080, 1500, 120, 84);
    g.fillStyle = '#d4e9f0'; g.fillRect(1084, 1504, 112, 34);
    g.fillStyle = '#4fae8a'; g.fillRect(1134, 1540, 12, 34); g.fillRect(1123, 1551, 34, 12);
    // market awnings
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#7a3e2a' : '#a8603a';
      g.fillRect(1360 + i * 26, 1150, 22, 70);
    }

    // trees
    for (let i = 0; i < 1400; i++) {
      const x = r() * W, y = r() * H;
      if (x < coastX(y) + 40) continue;
      const inPark = x > 1580 && x < 2000 && y > 1310 && y < 1650;
      const inTown = blocks.some(([bx, by, bw, bh]) => x > bx - 10 && x < bx + bw + 10 && y > by - 10 && y < by + bh + 10);
      if (inTown) continue;
      if (!inPark && r() < 0.35) continue;
      const s = 7 + r() * 9;
      g.fillStyle = r() < 0.5 ? C.tree : C.tree2;
      g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
    }

    // roads
    const coastal = [];
    for (let y = -40; y <= H + 40; y += 40) coastal.push([coastX(y) + 170, y]);
    const roads = [
      coastal,
      [[coastX(1250), 1250], [W + 40, 1250]],
      [[1500, 300], [1500, 2340]],
      [[coastX(1700) + 170, 1700], [W + 40, 1700]],
      [[2050, 560], [2050, H + 40]],
      [[1500, 1000], [2050, 1000]],
      [[coastX(2050) + 170, 2050], [1500, 2050]],
      [[coastX(800) + 170, 800], [1500, 800]],
    ];
    for (const [w, col] of [[36, C.roadEdge], [28, C.road]]) {
      g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const rd of roads) { smoothPath(g, rd); g.stroke(); }
    }
    g.strokeStyle = C.dash; g.lineWidth = 2; g.setLineDash([12, 14]);
    for (const rd of roads) { smoothPath(g, rd); g.stroke(); }
    g.setLineDash([]);

    // jetty
    const jx = coastX(1250);
    g.fillStyle = C.wood; g.fillRect(jx - 232, 1238, 236, 24);
    g.fillStyle = '#7a6143';
    for (let x = jx - 228; x < jx; x += 12) g.fillRect(x, 1240, 2, 20);
    g.fillRect(jx - 262, 1222, 40, 56);

    // lamps
    const lamp = (x, y) => {
      const grd = g.createRadialGradient(x, y, 0, x, y, 30);
      grd.addColorStop(0, 'rgba(255,190,100,0.5)'); grd.addColorStop(1, 'rgba(255,190,100,0)');
      g.fillStyle = grd; g.fillRect(x - 30, y - 30, 60, 60);
      g.fillStyle = '#ffd9a0'; g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
    };
    for (let x = 820; x < W; x += 120) lamp(x, 1226);
    for (let y = 380; y < 2300; y += 130) lamp(1524, y);
    for (let i = jx - 220; i < jx; i += 70) lamp(i, 1232);

    // map labels
    g.fillStyle = C.label;
    g.textAlign = 'center';
    g.font = '700 30px "KG Miss Stewart", sans-serif';
    g.save(); g.translate(250, 1300); g.rotate(-Math.PI / 2);
    g.fillText('S O U T H   C H I N A   S E A', 0, 0); g.restore();
    g.font = '700 26px "KG Miss Stewart", sans-serif';
    g.fillText('KUALA PENYU', 1150, 1505 - 30);

    return c;
  }



  // ---------- Places (placeholder positions) ----------
  const places = [
    { id: 'jetty', type: 'landmark', name: 'Kuala Penyu Jetty', x: coastX(1250) - 90, y: 1250,
      text: 'Boats out to the islands leave from here. A safe, well-lit jetty keeps fishing and island trips running for the whole town.' },
    { id: 'tamu', type: 'landmark', name: 'Tamu Market', x: 1420, y: 1190,
      text: 'Farmers and fishers sell local produce here. Buying local keeps money in the community and cuts down on transport.' },
    { id: 'hall', type: 'landmark', name: 'Community Hall', x: 980, y: 1180,
      text: 'Weddings, gotong-royong days and town meetings happen here. Shared spaces like this hold a community together.' },
    { id: 'school', type: 'landmark', name: 'Primary School', x: 1700, y: 1880,
      text: 'Safe footpaths and crossings let children walk to school. Tag broken paths in the app so they can be reported.' },
    { id: 'clinic', type: 'health', name: 'Klinik Kesihatan', x: 1150, y: 1560,
      text: 'Your nearest public clinic. Walking here for check-ups instead of driving short distances is good for your heart.' },
    { id: 'water', type: 'health', name: 'Water Refill Point', x: 1780, y: 1250,
      text: 'Refill your bottle here. Drink water often on long walks in the afternoon heat, and skip the single-use plastic.' },
    { id: 'gym', type: 'health', name: 'Park Fitness Corner', x: 1800, y: 1500,
      text: 'Outdoor exercise stations under the trees. Ten minutes of stretching after a walk helps your muscles recover.' },
    { id: 'trail', type: 'health', name: 'Beach Walk Trail', x: coastX(2000) + 30, y: 2000,
      text: 'A flat walk along the shore at sunset. Walking on sand works your legs harder than walking on pavement.' },
    { id: 'lumpit', type: 'creature', name: 'Lumpit', x: coastX(1250) - 200, y: 1250, hint: 'Something splashes where the boats rest.',
      text: 'A small water creature that follows the fishing boats home at dusk. Added to your collection.' },
    { id: 'tobuk', type: 'creature', name: 'Tobuk', x: 1500, y: 905, hint: 'Bubbles along the river bend.',
      text: 'Tobuk only lives in clean water. Keeping rubbish out of the river keeps it around. Added to your collection.' },
    { id: 'siriban', type: 'creature', name: 'Siriban', x: coastX(2250) + 18, y: 2250, hint: 'Footprints on the sand where the tide turns.',
      text: 'Siriban collects shells along the shore. Join a beach clean-up and you might spot one. Added to your collection.' },
  ];
  const TAGS = { landmark: 'SDG 11 · Community', health: 'SDG 3 · Health spot', creature: 'Creature' };

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const app = $('app'), canvas = $('map'), ctx = canvas.getContext('2d');
  const creature = $('creature'), stick = $('stick'), knob = $('knob');
  const ui = {
    steps: $('steps'), km: $('km'), found: $('found'),
    sheet: $('sheet'), sTag: $('sTag'), sTitle: $('sTitle'), sText: $('sText'), sDist: $('sDist'), sBtn: $('sBtn'),
    sClose: $('sheetClose'), quest: $('quest'), level: $('level'), toast: $('toast'), mode: $('modePill'),
  };

  // ---------- State ----------
  let px = 1300, py = 1330;
  let steps = Lalaangan.getActivity().today.steps, xp = 340, lvl = 7, healthDone = 0, questDone = false;
  let facing = 1, walking = false, filter = 'all';
  let open = null;            // place shown in the sheet
  let autoShown = new Set();  // places that auto-opened while in range
  const joy = { x: 0, y: 0 };
  const keys = new Set();
  let cw = 0, ch = 0, dpr = 1, world = null;
  const ZOOM_MIN = 0.5, ZOOM_MAX = 1.6, ZOOM_STEP = 1.25;
  let zoom = 1, zoomTarget = 1;

  const visible = p => filter === 'all' || p.type === filter;
  const distTo = p => Math.hypot(p.x - px, p.y - py);

  // ---------- Movement ----------
  function isWater(x, y) {
    const cx = coastX(y);
    const onJetty = y > 1232 && y < 1268 && x > cx - 260 && x < cx + 4;
    return x < cx - 2 && !onJetty;
  }
  const blocked = (x, y) => x < 40 || y < 40 || x > W - 40 || y > H - 40 || isWater(x, y);

  function readInput() {
    let dx = joy.x, dy = joy.y;
    if (keys.has('left')) dx -= 1;
    if (keys.has('right')) dx += 1;
    if (keys.has('up')) dy -= 1;
    if (keys.has('down')) dy += 1;
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    return { dx, dy, m: Math.min(m, 1) };
  }

  // ---------- Rendering ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = app.clientWidth; ch = app.clientHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }

  function pin(x, y, color, glyph, active) {
    // teardrop pin with tip at (x, y)
    ctx.save();
    ctx.translate(x, y);
    if (active) {
      ctx.fillStyle = color; ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(120,80,30,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-6, -10, -15, -16, -15, -28);
    ctx.arc(0, -28, 15, Math.PI, 0);
    ctx.bezierCurveTo(15, -16, 6, -10, 0, 0);
    ctx.fill();
    ctx.fillStyle = '#fff7ea';
    ctx.beginPath(); ctx.arc(0, -28, 9.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    glyph(ctx);
    ctx.restore();
  }
  const glyphs = {
    landmark: g => { // little house
      g.beginPath(); g.moveTo(0, -34.5); g.lineTo(6, -28.5); g.lineTo(4, -28.5); g.lineTo(4, -23); g.lineTo(-4, -23); g.lineTo(-4, -28.5); g.lineTo(-6, -28.5); g.closePath(); g.fill();
    },
    health: g => { g.fillRect(-1.8, -34, 3.6, 12); g.fillRect(-6, -29.8, 12, 3.6); },
    done: g => {
      g.strokeStyle = g.fillStyle; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-4.5, -28); g.lineTo(-1, -24.5); g.lineTo(5, -31.5); g.stroke();
    },
  };

  function label(text, x, y) {
    ctx.font = '700 12px "Nunito Sans", sans-serif';
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(255,247,234,0.92)';
    ctx.beginPath(); ctx.roundRect(x - w / 2, y + 6, w, 20, 10); ctx.fill();
    ctx.fillStyle = '#4a3426'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 16.5);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.sea; ctx.fillRect(0, 0, cw, ch);
    const cx = cw / 2, cy = ch * CAM_Y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-px, -py);
    ctx.imageSmoothingQuality = 'high';
    if (world) ctx.drawImage(world, 0, 0);
    ctx.restore();

    // discovery radius scales with the map
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, RADIUS * zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(143,182,255,0.05)'; ctx.fill();
    ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t / 60;
    ctx.strokeStyle = 'rgba(143,182,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);

    const pulse = (Math.sin(t / 400) + 1) / 2;
    const list = places.filter(visible).sort((a, b) => a.y - b.y);
    for (const p of list) {
      const x = cx + (p.x - px) * zoom, y = cy + (p.y - py) * zoom;
      if (x < -80 || x > cw + 80 || y < -60 || y > ch + 60) continue;
      const active = open === p;
      if (p.type === 'creature') {
        if (p.done) {
          ctx.fillStyle = '#f0a04b';
          ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3b2410'; ctx.font = '800 14px "KG Miss Stewart", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x, y + 1);
          continue;
        }
        const gr = 24 + pulse * 12;
        const grd = ctx.createRadialGradient(x, y, 4, x, y, gr);
        grd.addColorStop(0, 'rgba(240,160,75,0.6)'); grd.addColorStop(1, 'rgba(240,160,75,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, gr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff7ea'; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d9822f'; ctx.lineWidth = active ? 3 : 2; ctx.stroke();
        ctx.fillStyle = '#d9822f'; ctx.font = '800 17px "KG Miss Stewart", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y + 1);
      } else {
        const col = p.type === 'health' ? '#3f9f80' : '#4f8fc4';
        pin(x, y, p.done ? 'rgba(74,52,38,0.45)' : col, p.done ? glyphs.done : glyphs[p.type], active);
        label(p.name, x, y);
      }
    }
    ctx.restore();
  }

  // ---------- UI ----------
  const fmt = n => Math.round(n).toLocaleString('en-US');

  function updateQuest() {
    ui.steps.textContent = fmt(steps);
    ui.km.textContent = Lalaangan.getActivity().today.distanceKm.toFixed(2);
    ui.found.textContent = places.filter(p => p.done).length;
    if (!questDone && steps >= STEP_GOAL && healthDone >= HEALTH_GOAL) {
      questDone = true; gainXp(100);
      toast('Daily walk complete · +100 XP');
    }
  }

  function setLevelRing() {
    const pct = Math.round(xp / 500 * 100);
    ui.level.style.background =
      `radial-gradient(circle at center, var(--panel-solid) 58%, transparent 60%), conic-gradient(var(--lantern) 0 ${pct}%, rgba(74,52,38,0.12) ${pct}% 100%)`;
    ui.level.querySelector('b').textContent = lvl;
    ui.level.setAttribute('aria-label', `Level ${lvl}, ${xp} of 500 XP`);
  }
  function gainXp(n) {
    xp += n;
    while (xp >= 500) { xp -= 500; lvl++; toast(`Level up! You're now level ${lvl}`); }
    setLevelRing();
  }

  function openSheet(p) {
    open = p;
    ui.sheet.hidden = false;
    ui.sTag.textContent = TAGS[p.type];
    ui.sTag.className = 'tag ' + p.type;
    ui.sTitle.textContent = p.type === 'creature' && !p.done ? 'Unknown creature' : p.name;
    ui.sText.textContent = p.type === 'creature' && !p.done ? p.hint : p.text;
    refreshSheet();
  }
  function closeSheet() {
    open = null;
    ui.sheet.hidden = true;
  }
  function refreshSheet() {
    if (!open) return;
    const d = distTo(open), inRange = d <= RADIUS;
    ui.sDist.textContent = inRange ? 'You are here' : `≈ ${Math.max(10, Math.round(d * M_PER_PX / 10) * 10)} m away`;
    const btn = ui.sBtn;
    btn.classList.remove('done');
    if (open.done) {
      btn.disabled = true; btn.classList.add('done');
      btn.textContent = open.type === 'creature' ? 'In collection' : 'Checked in';
    } else if (!inRange) {
      btn.disabled = true; btn.textContent = 'Walk closer';
    } else {
      btn.disabled = false;
      btn.textContent = open.type === 'creature' ? 'Discover' : open.type === 'health' ? 'Check in · +20 XP' : 'Check in · +15 XP';
    }
  }

  function act() {
    const p = open;
    if (!p || p.done || distTo(p) > RADIUS) return;
    p.done = true;
    if (p.type === 'creature') {
      gainXp(40);
      ui.sTitle.textContent = p.name; ui.sText.textContent = p.text;
      toast(`${p.name} joined your collection · +40 XP`);
    } else if (p.type === 'health') {
      healthDone++; gainXp(20);
      toast(`Checked in at ${p.name} · +20 XP`);
    } else {
      gainXp(15);
      toast(`Checked in at ${p.name} · +15 XP`);
    }
    refreshSheet(); updateQuest();
  }

  function autoOpen() {
    // Pop the sheet once when the player walks into range of a visible place
    for (const p of places) {
      const inR = distTo(p) <= RADIUS;
      if (!inR) { autoShown.delete(p.id); continue; }
      if (visible(p) && !p.done && !autoShown.has(p.id) && open !== p) {
        autoShown.add(p.id);
        openSheet(p);
        break;
      }
    }
  }

  function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { ui.toast.hidden = true; }, 2600);
  }

  // ---------- Loop ----------
  let last = performance.now(), lastUi = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    const { dx, dy, m } = readInput();
    const moving = m > 0.15;
    if (moving) {
      const sx = dx * SPEED * dt, sy = dy * SPEED * dt;
      const ox = px, oy = py;
      if (!blocked(px + sx, py + sy)) { px += sx; py += sy; }
      else if (!blocked(px + sx, py)) px += sx;
      else if (!blocked(px, py + sy)) py += sy;
      const walked = Math.hypot(px - ox, py - oy) * M_PER_PX / STEP_M;
      steps += walked;
      Lalaangan.addSteps(walked); // shared with Home and Profile
      if (Math.abs(dx) > 0.2) facing = dx < 0 ? -1 : 1;
    }
    if (moving !== walking) { walking = moving; creature.classList.toggle('walking', walking); }
    creature.classList.toggle('left', facing < 0);

    if (Math.abs(zoomTarget - zoom) > 0.001) zoom += (zoomTarget - zoom) * Math.min(1, dt * 12);
    else zoom = zoomTarget;
    draw(t);
    if (moving || t - lastUi > 400) { updateQuest(); autoOpen(); refreshSheet(); lastUi = t; }
    requestAnimationFrame(frame);
  }

  // ---------- Input ----------
  let jid = null;
  function moveJoy(e) {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 16, d = Math.hypot(dx, dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joy.x = dx / max; joy.y = dy / max;
  }
  function endJoy(e) {
    if (e.pointerId !== jid) return;
    jid = null; joy.x = joy.y = 0;
    knob.style.transform = 'translate(-50%, -50%)';
    stick.classList.remove('active');
  }
  stick.addEventListener('pointerdown', e => {
    jid = e.pointerId; stick.setPointerCapture(jid);
    stick.classList.add('active'); moveJoy(e); e.preventDefault();
  });
  stick.addEventListener('pointermove', e => { if (e.pointerId === jid) moveJoy(e); });
  stick.addEventListener('pointerup', endJoy);
  stick.addEventListener('pointercancel', endJoy);

  const keyMap = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  window.addEventListener('keydown', e => {
    if (keyMap[e.key]) { keys.add(keyMap[e.key]); e.preventDefault(); }
    if (e.key === 'Enter' && open && !ui.sBtn.disabled) { act(); e.preventDefault(); }
    if (e.key === 'Escape' && open) closeSheet();
  });
  window.addEventListener('keyup', e => { if (keyMap[e.key]) keys.delete(keyMap[e.key]); });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const tx = e.clientX - r.left, ty = e.clientY - r.top;
    let hit = null, bd = 30;
    for (const p of places) {
      if (!visible(p)) continue;
      const sx = cw / 2 + (p.x - px) * zoom;
      const sy = ch * CAM_Y + (p.y - py) * zoom - (p.type === 'creature' ? 0 : 26); // pins: aim at the head
      const d = Math.hypot(sx - tx, sy - ty);
      if (d < bd) { bd = d; hit = p; }
    }
    if (hit) openSheet(hit);
  });

  document.querySelectorAll('.chip').forEach(btn => btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    if (open && !visible(open)) closeSheet();
  }));
  ui.sBtn.addEventListener('click', act);
  ui.sClose.addEventListener('click', closeSheet);
  ui.mode.addEventListener('click', () => toast('Real GPS turns on in the live web version. At the booth, walk with the joystick.'));
  document.querySelectorAll('.tab').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (!a.classList.contains('tab-map')) toast(`${a.textContent.trim()} opens its own page`);
  }));

  // ---------- Zoom ----------
  const zIn = $('zoomIn'), zOut = $('zoomOut'), zLevel = $('zoomLevel');
  function setZoom(z) {
    zoomTarget = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    zIn.disabled = zoomTarget >= ZOOM_MAX - 0.001;
    zOut.disabled = zoomTarget <= ZOOM_MIN + 0.001;
    zLevel.style.height = ((zoomTarget - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN) * 100) + '%';
  }
  zIn.addEventListener('click', () => setZoom(zoomTarget * ZOOM_STEP));
  zOut.addEventListener('click', () => setZoom(zoomTarget / ZOOM_STEP));
  canvas.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoomTarget * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') setZoom(zoomTarget * ZOOM_STEP);
    if (e.key === '-' || e.key === '_') setZoom(zoomTarget / ZOOM_STEP);
  });
  // two-finger pinch on the map
  const touches = new Map();
  let pinchStart = 0, pinchZoom = 1;
  canvas.addEventListener('pointerdown', e => {
    touches.set(e.pointerId, e);
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinchStart = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); pinchZoom = zoomTarget;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, e);
    if (touches.size === 2 && pinchStart) {
      const [a, b] = [...touches.values()];
      setZoom(pinchZoom * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinchStart);
      zoom = zoomTarget;
    }
  });
  const dropTouch = e => { touches.delete(e.pointerId); if (touches.size < 2) pinchStart = 0; };
  canvas.addEventListener('pointerup', dropTouch);
  canvas.addEventListener('pointercancel', dropTouch);
  setZoom(1);

  window.addEventListener('resize', resize);
  resize();
  world = buildWorld();
  setLevelRing();
  updateQuest();
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { world = buildWorld(); });
})();