// Builds the visitor's Viking on the location screens from their station answers.
// The hand-drawn base body (picture/model/base.png) is dressed by stacking the
// outfit / weapon / mentor drawings on top of it.
(() => {
  const DIR = "picture/model/";

  // Positions are in pixels of base.png (443 x 833); the stage adds margins
  // around it so horns, weapons and the horn can stick out.
  const BASE_W = 443, BASE_H = 833;
  const MARGIN = { left: 70, top: 100, right: 70, bottom: 10 };
  const STAGE_W = BASE_W + MARGIN.left + MARGIN.right;
  const STAGE_H = BASE_H + MARGIN.top + MARGIN.bottom;

  // file: [left, top, width]
  const LAYOUT = {
    "cloak.png":        [-40, -20, 523],
    "weapon-spear.png": [344, 100, 122],
    "weapon-sword.png": [367, 249, 151],
    "weapon-axe.png":   [311, 280, 188],
    "weapon-knife.png": [383, 300, 100],
    "horn.png":         [-62, 330, 140],
    "base.png":         [0, 0, 443],
    "wrap-left.png":    [142, 560, 72],
    "wrap-right.png":   [226, 568, 76],
    "outfit.png":       [97, 212, 250],   // shared by all four outfits
    "helmet.png":       [82, -52, 280]
  };

  const OUTFITS = { SUMMER: "summer", FALL: "fall", WINTER: "winter", SPRING: "spring" };
  const WEAPONS = { SPEAR: "spear", SWORD: "sword", AXE: "axe", KNIFE: "knife" };

  function layer(file, layoutKey = file) {
    const [left, top, width] = LAYOUT[layoutKey];
    const img = document.createElement("img");
    img.src = DIR + file;
    img.alt = "";
    img.style.left = ((left + MARGIN.left) / STAGE_W) * 100 + "%";
    img.style.top = ((top + MARGIN.top) / STAGE_H) * 100 + "%";
    img.style.width = (width / STAGE_W) * 100 + "%";
    return img;
  }

  window.renderVikingModel = (container, answers = {}) => {
    const season = OUTFITS[answers["1"]];
    const weapon = WEAPONS[answers["2"]];
    const mentor = answers["3"];

    const stage = document.createElement("div");
    stage.className = "vm-stage";
    stage.style.aspectRatio = `${STAGE_W} / ${STAGE_H}`;

    // back to front
    if (mentor === "THYRA") stage.append(layer("cloak.png"));
    if (weapon) stage.append(layer(`weapon-${weapon}.png`));      // behind the hand, so it looks held
    if (mentor === "GORM THE OLD") stage.append(layer("horn.png"));
    stage.append(layer("base.png"));
    if (mentor === "NO ONE") stage.append(layer("wrap-left.png"), layer("wrap-right.png"));
    if (season) stage.append(layer(`outfit-${season}.png`, "outfit.png"));
    if (mentor === "KNUD") stage.append(layer("helmet.png"));

    stage.setAttribute("role", "img");
    stage.setAttribute("aria-label", "Your Viking: " +
      [answers["1"], answers["2"], answers["3"]].filter(Boolean).join(", ").toLowerCase());

    container.replaceChildren(stage);
  };
})();
