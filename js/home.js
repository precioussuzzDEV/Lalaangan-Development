// ---------- Home screen ----------
// Placeholder data. Replace with real tracking / saved progress later.
// Level and day streak live in js/status.js (shared with the other screens).
// "Did You Know?" facts. A random one shows each time Home loads.
const FACTS = [
  "Sabah is known as the Land Below the Wind because it lies south of the main typhoon belt.",
  "A legend tells of Huminodun, a young woman who sacrificed herself to save her people from famine.",
  "The Proboscis monkey is naturally found only on the island of Borneo.",
  "Batu Punggul in Nabawan is associated with a Murut legend about a sacred stone and a supernatural curse.",
  "Borneo is the third-largest island in the world.",
  "The Rafflesia can grow almost one metre in diameter.",
  "Kota Belud is famous for its Bajau horsemen, often called the Cowboys of the East.",
  "Nunuk Ragang, meaning Red Banyan Tree, is remembered as an ancestral homeland in Kadazandusun oral tradition.",
  "Sabah is home to more than 30 indigenous ethnic groups.",
  "The Kinabatangan River is one of Sabah's most important wildlife habitats.",
  "The Bajau Laut have a long-standing maritime culture closely connected to the ocean.",
  "The Tip of Borneo in Kudat marks the northernmost point of Borneo.",
  "Sun bears are the smallest bear species in the world.",
  "A local legend from Kuala Penyu tells of a turtle transformed into stone.",
  "Mount Kinabalu stands at 4,095 metres above sea level.",
  "Some pitcher plants trap insects to obtain nutrients.",
  "Kinabalu Park was Malaysia's first UNESCO World Heritage Site.",
  "Hornbills are important cultural symbols in several communities across Borneo.",
  "Gomantong Caves in Sandakan are famous for their edible swiftlet nests.",
  "Butterflies taste using special sensors on their feet.",
  "Sabah's Rungus communities are known for their traditional longhouses.",
  "Danum Valley is home to some of Sabah's oldest tropical rainforests.",
  "The slow loris is one of the few venomous primates in the world.",
  "Tunku Abdul Rahman Marine Park consists of five islands near Kota Kinabalu.",
  "The name Lahad Datu is commonly explained through Bajau words associated with a place and datu.",
  "Mangrove forests help protect coastlines from erosion.",
  "Sea turtles can travel thousands of kilometres during their lifetime.",
  "Tambunan is known for its beautiful valley landscapes and traditional rice cultivation.",
  "Borneo is shared by three countries: Malaysia, Indonesia and Brunei.",
  "Bats play an important role in pollination and seed dispersal.",
  "Sipadan Island is famous for its incredible marine biodiversity.",
  "The Lotud community of Tuaran has its own traditional beliefs and ritual practices.",
  "Some lizards can glide between trees using special skin membranes.",
  "Bohey Dulang Island features a spectacular volcanic caldera landscape.",
  "Coral reefs support approximately a quarter of all marine species.",
  "Sabah's interior districts are home to diverse Murut communities and rich oral storytelling traditions.",
  "Fungi help recycle nutrients by breaking down dead organic matter.",
  "Tawau Hills Park contains volcanic features within its rainforest landscape.",
  "Sandakan was once the capital of British North Borneo.",
  "Seagrass meadows provide important feeding grounds for dugongs."
];

function pickFact() {
  return FACTS[Math.floor(Math.random() * FACTS.length)];
}

const player = {
  creature: "Creature name", mood: "Happy and full of energy",
  hidingM: 300,
  didYouKnow: pickFact(),
};

function renderHome() {
  const act = Lalaangan.getActivity().today; // steps, distance, calories (js/activity.js)
  // Daily goal = the step goal from Settings, shown as distance
  const goalKm = Lalaangan.stepsToKm(Lalaangan.getStepGoal());
  const text = {
    creature: player.creature,
    mood: player.mood,
    hiding: "A creature is hiding " + player.hidingM + " m away",
    distance: act.distanceKm.toFixed(2) + " km",
    steps: act.steps.toLocaleString("en-US"),
    goalText: act.distanceKm.toFixed(2) + " / " + +goalKm.toFixed(2) + " km",
    didYouKnow: player.didYouKnow,
  };
  document.querySelectorAll("[data-field]").forEach((el) => {
    el.textContent = text[el.dataset.field];
  });
  document.getElementById("goal-fill").style.width =
    Math.min(100, (act.distanceKm / goalKm) * 100) + "%";
  // Milestone bar follows the same distance as the daily goal:
  // nodes at 25/50/75% of the goal, the gift at 100%.
  document.getElementById("milestone-fill").style.width =
    Math.min(100, (act.distanceKm / goalKm) * 100) + "%";
}
renderHome();
Lalaangan.onActivity(renderHome); // keep Home in sync when steps are added

// ---- Tappable creature (js/creature-tap.js) ----
// Swaps the grey placeholder for the real art once the PNG loads, then makes it react to taps.
(function () {
  var img = document.getElementById("creature-img");
  var ph = document.getElementById("creature-placeholder");
  if (!img || !window.CreatureTap) return; // library or art missing: keep the placeholder

  function ready() {
    if (ph) ph.hidden = true;
    img.hidden = false;
    var s = {};
    try { s = JSON.parse(localStorage.getItem("lalaangan.settings")) || {}; } catch (e) {}
    window.pet = CreatureTap.attach(img, {
      haptics: s.haptics !== false, // follows the Haptics setting
      onReact: function (name) {
        // each reaction has its own sound (see "pet-" sounds in js/sfx.js); volume handled there
        var sound = name === "stepGoal" || name === "stepGoalHops" || name === "stepGoalGlow" ? "pet-goal" : "pet-" + name;
        if (window.Lalaangan && Lalaangan.playSfx) Lalaangan.playSfx(sound);
      }
    });
  }
  if (img.complete && img.naturalWidth) ready();
  else img.addEventListener("load", ready, { once: true }); // error: stays hidden
})();
// Bottom navigation is handled by js/nav.js