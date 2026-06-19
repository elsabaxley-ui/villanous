/*
 * Villainous — UI layer
 * ------------------------------------------------------------------
 * Renders the single `game` state object and wires up player actions.
 * Holds no game state of its own (only transient selection state).
 */

let game = null;
let setup = { count: 2, picks: [] };
let pendingFate = null; // { drawn, targetIndex } awaiting a choice
let tutorialOpen = false; // "How to Play" overlay

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};

// ---- setup screen --------------------------------------------------

function renderSetup() {
  const root = $("#app");
  root.innerHTML = "";
  root.style.removeProperty("--vc"); // back to default theme for setup
  document.body.className = ""; // clear villain atmosphere on setup screen
  const wrap = el("div", "setup");
  wrap.appendChild(el("h1", "title", "Villainous <span>Online</span>"));
  wrap.appendChild(
    el("p", "subtitle", "Local hot-seat — pick 2–6 villains, then pass the device on each turn.")
  );

  const grid = el("div", "villain-grid");
  VILLAIN_ORDER.forEach((key) => {
    const v = VILLAINS[key];
    const card = el("div", "villain-pick" + (setup.picks.includes(key) ? " picked" : ""));
    card.style.setProperty("--vc", v.color);
    card.innerHTML = `
      <div class="vp-heart">${v.icon || v.heart} <span class="vp-spark">✨</span></div>
      <div class="vp-name">${v.heart} ${v.name}</div>
      <div class="vp-title">${v.title}</div>
      <div class="vp-diff" title="Difficulty ${villainDifficulty(key)}/5">${difficultyStars(key)}</div>
      <div class="vp-obj">🎯 ${v.objectiveText}</div>
      <div class="vp-badge"></div>`;
    card.addEventListener("click", () => togglePick(key, card));
    card.dataset.key = key;
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const bar = el("div", "setup-bar");
  bar.appendChild(el("div", "pick-hint", "Select 2–6 villains"));
  const buttons = el("div", "setup-buttons");
  const even = el("button", "btn btn-ghost", "⚖️ Even Match");
  even.title = "Auto-pick a lineup of villains with matched difficulty";
  even.addEventListener("click", evenMatch);
  const start = el("button", "btn btn-primary", "Start Game");
  start.id = "start-btn";
  start.disabled = true;
  start.addEventListener("click", startGame);
  buttons.appendChild(even);
  buttons.appendChild(start);
  bar.appendChild(buttons);
  wrap.appendChild(bar);

  root.appendChild(wrap);
  refreshPickState();
}

function togglePick(key, card) {
  const i = setup.picks.indexOf(key);
  if (i === -1) {
    if (setup.picks.length >= 6) return;
    setup.picks.push(key);
    card.classList.add("picked");
  } else {
    setup.picks.splice(i, 1);
    card.classList.remove("picked");
  }
  refreshPickState();
}

function refreshPickState() {
  document.querySelectorAll(".villain-pick").forEach((c) => {
    const order = setup.picks.indexOf(c.dataset.key);
    c.querySelector(".vp-badge").textContent = order === -1 ? "" : "P" + (order + 1);
  });
  const btn = $("#start-btn");
  if (btn) btn.disabled = setup.picks.length < 2;
  const hint = $(".pick-hint");
  if (hint) {
    if (setup.picks.length < 2) {
      hint.textContent = `Select 2–6 villains (${setup.picks.length} chosen)`;
    } else {
      const diffs = setup.picks.map(villainDifficulty);
      const lo = Math.min(...diffs);
      const hi = Math.max(...diffs);
      const spread = hi - lo;
      const balance =
        spread === 0 ? "perfectly even ⚖️" : spread <= 1 ? "well matched" : "uneven — try Even Match";
      hint.textContent = `${setup.picks.length} villains · difficulty ${lo}★–${hi}★ (${balance})`;
    }
  }
}

// Auto-pick a lineup whose villains are as close in difficulty as possible.
function evenMatch() {
  const count = setup.picks.length >= 2 ? setup.picks.length : 4;
  const sorted = VILLAIN_ORDER.slice().sort(
    (a, b) => villainDifficulty(a) - villainDifficulty(b)
  );
  // Slide a window of `count` and find the smallest difficulty spread.
  let minSpread = Infinity;
  const windows = [];
  for (let i = 0; i + count <= sorted.length; i++) {
    const win = sorted.slice(i, i + count);
    const spread = villainDifficulty(win[win.length - 1]) - villainDifficulty(win[0]);
    if (spread < minSpread) minSpread = spread;
    windows.push({ win, spread });
  }
  // Among the tightest windows, pick one at random for variety.
  const best = windows.filter((w) => w.spread === minSpread);
  const chosen = best[Math.floor(Math.random() * best.length)];
  setup.picks = chosen.win.slice();
  renderSetup();
}

function startGame() {
  game = newGame(setup.picks);
  tutorialOpen = true; // greet the first player with the How-to-Play guide
  render();
}

// ---- main game render ----------------------------------------------

function render() {
  if (game.winner != null) return renderWinner();
  const root = $("#app");
  root.innerHTML = "";
  const p = currentPlayer(game);
  // Theme the WHOLE game screen with the active villain's color so every
  // location, button and accent inherits it.
  root.style.setProperty("--vc", VILLAINS[p.villainKey].color);
  // Per-villain background atmosphere (see styles.css body.theme-*).
  document.body.className = "theme-" + p.villainKey;

  root.appendChild(renderTopBar(p));
  if (game.turn === 1) root.appendChild(renderCoach(p)); // first-round guidance
  const main = el("div", "main");
  main.appendChild(renderRealm(p));
  main.appendChild(renderSidebar(p));
  root.appendChild(main);
  root.appendChild(renderHand(p));
  if (pendingFate) root.appendChild(renderFateChooser());
  if (tutorialOpen) root.appendChild(renderTutorial(p));
}

// A one-line "what to do now" strip shown during the first round.
function renderCoach(p) {
  const step =
    game.phase === "move"
      ? `<b>Step 1 — Move:</b> click <b>“Move here”</b> on a location different from where you are.`
      : `<b>Step 2 — Act:</b> click the glowing <b>action buttons</b> at your location (Gain Power, Play a Card, Fate…), then press <b>End Turn ▶</b>.`;
  const coach = el("div", "coach", `🧭 ${step} <span class="coach-help">Need the full rules? Tap ❓ Help.</span>`);
  return coach;
}

function renderTutorial(p) {
  const v = VILLAINS[p.villainKey];
  const overlay = el("div", "overlay");
  const box = el("div", "modal tutorial");
  box.innerHTML = `
    <h2>How to Play — Villainous</h2>
    <p class="tut-intro">You are <b style="color:var(--vc)">${v.icon} ${p.name}</b>. Each turn:</p>
    <ol class="tut-steps">
      <li><b>🦹 Move</b> your mover to a <b>different</b> location (click “Move here”). You must move every turn.</li>
      <li><b>⚡ Take actions</b> shown at that location: Gain Power, Play a Card, Fate, Vanquish, and more. A <b>Hero covers the top actions</b>, so defeat or work around it.</li>
      <li><b>🃏 Play cards</b> from your hand by spending Power — Allies (to fight Heroes), Items, and Effects.</li>
      <li><b>🎴 Fate</b> an opponent to drop Heroes into their realm and slow them down.</li>
      <li><b>▶ End Turn</b> to draw back up to 4 cards and pass the device.</li>
    </ol>
    <p class="tut-obj">🎯 <b>Your goal:</b> ${v.objectiveText}</p>
    <div class="tut-win">
      <div class="tut-win-label">🏆 How to win as ${v.name}:</div>
      <ol class="tut-win-steps">
        ${villainGuide(p.villainKey).map((s) => `<li>${s}</li>`).join("")}
      </ol>
    </div>
    <p class="tut-tip">💡 Watch the 🎯 tracker in the top bar to see your progress. Some locations start 🔒 locked.</p>`;
  const btn = el("button", "btn btn-primary", "Got it — let's play!");
  btn.addEventListener("click", () => {
    tutorialOpen = false;
    render();
  });
  box.appendChild(btn);
  overlay.appendChild(box);
  return overlay;
}

// Short objective-progress readout for villains with a counter/token goal.
function objectiveProgress(p) {
  switch (p.villainKey) {
    case "scar":
      return `Succession ${p.successionStrength}/15 Strength`;
    case "cruella":
      return `Puppies ${p.puppies}/99`;
    case "gaston": {
      const left = p.board.reduce((n, l) => n + l.obstacles, 0);
      return `Obstacles left: ${left}`;
    }
    case "facilier": {
      const tal = p.board.some((l) => l.cards.some((c) => c.subtype === "talisman"));
      return `Talisman ${tal ? "✓" : "✗"} · Rule N.O. ${p.flags.ruleNewOrleans ? "✓" : "✗"}`;
    }
    case "snow":
      return `Katniss ${p.flags.katnissDefeated ? "✓" : "✗"} · Rebel Army ${
        p.flags.objectiveHeroDefeated ? "✓" : "✗"
      }`;
    case "darkstalker":
      return `Crown ${p.flags["trophy_Crown of the NightWings"] ? "✓" : "✗"} · IceWing Army ${
        p.flags.objectiveHeroDefeated ? "✓" : "✗"
      }`;
    case "voldemort": {
      const h = p.board.reduce(
        (n, l) => n + l.cards.filter((c) => c.subtype === "hallow").length,
        0
      );
      return `Hallows ${h}/3 · Harry ${p.flags.harryDefeated ? "✓" : "✗"}`;
    }
    case "drago": {
      const sanctuary = p.board.find((l) => l.name === "The Dragon Sanctuary");
      const bw = sanctuary && sanctuary.cards.some((c) => c.subtype === "bewilderbeast");
      return `Bewilderbeast ${bw ? "✓" : "✗"} · Hiccup ${p.flags.hiccupDefeated ? "✓" : "✗"}`;
    }
    case "burr":
      return `Influence ${p.politicalInfluence}/10 · Hamilton ${
        p.flags.hamiltonDefeated ? "✓" : "✗"
      }`;
    default:
      return null;
  }
}

function renderTopBar(p) {
  const v = VILLAINS[p.villainKey];
  const bar = el("div", "topbar");
  bar.style.setProperty("--vc", v.color);
  const progress = objectiveProgress(p);
  bar.innerHTML = `
    <div class="tb-left">
      <span class="tb-heart">${v.icon || v.heart}</span>
      <div>
        <div class="tb-name">${v.heart} ${p.name}</div>
        <div class="tb-title">${v.title}</div>
      </div>
    </div>
    <div class="tb-mid">
      <div class="tb-power">⚡ <b>${p.power}</b> Power</div>
      <div class="tb-phase">Turn ${game.turn} · ${
    game.phase === "move" ? "Move your mover" : "Take actions"
  }</div>
      ${progress ? `<div class="tb-progress">🎯 ${progress}</div>` : ""}
    </div>`;
  const right = el("div", "tb-right");
  const helpBtn = el("button", "btn btn-ghost", "❓ Help");
  helpBtn.addEventListener("click", () => {
    tutorialOpen = true;
    render();
  });
  const objBtn = el("button", "btn btn-ghost", "🎯 Objective");
  objBtn.addEventListener("click", () => {
    const steps = villainGuide(p.villainKey)
      .map((s, i) => `${i + 1}. ${s.replace(/<[^>]+>/g, "")}`)
      .join("\n");
    alert(`${p.name}'s objective:\n\n${v.objectiveText}\n\nHow to win:\n${steps}`);
  });
  const endBtn = el("button", "btn btn-primary", "End Turn ▶");
  endBtn.disabled = !game.moved;
  endBtn.title = game.moved ? "" : "Move your mover first";
  endBtn.addEventListener("click", () => {
    endTurn(game);
    render();
  });
  right.appendChild(helpBtn);
  right.appendChild(objBtn);
  right.appendChild(endBtn);
  bar.appendChild(right);
  return bar;
}

function renderRealm(p) {
  const realm = el("div", "realm");
  p.board.forEach((loc, i) => {
    const isHere = p.moverLocation === i;
    const heroPresent = loc.heroes.length > 0;
    // Actions only become usable in the "actions" phase, at the location
    // you moved to this turn.
    const canAct = isHere && game.phase === "actions" && !loc.locked;
    const card = el("div", "location" + (isHere ? " here" : "") + (loc.locked ? " locked" : ""));
    card.appendChild(el("div", "loc-head",
      `<span class="loc-name">${loc.locked ? "🔒 " : ""}${loc.name}</span>${
        loc.locked
          ? '<span class="loc-lock">Locked</span>'
          : isHere
          ? `<span class="loc-mover">🦹 ${
              game.phase === "move"
                ? "Start — move somewhere else first"
                : "You are here"
            }</span>`
          : ""
      }`));

    // Action symbols.
    const acts = el("div", "loc-actions");
    const top = el("div", "act-row" + (heroPresent ? " covered" : ""));
    loc.topActions.forEach((a) => top.appendChild(actionChip(a, canAct && !heroPresent)));
    const bottom = el("div", "act-row");
    loc.bottomActions.forEach((a) => bottom.appendChild(actionChip(a, canAct)));
    // Card-granted Vanquish (Snow's Rose / Darkstalker's Scroll).
    const hasGrantVanq = loc.cards.some((c) => c.grantsVanquish);
    const alreadyVanq = [...loc.topActions, ...loc.bottomActions].some((a) => a.a === "vanquish");
    if (hasGrantVanq && !alreadyVanq) {
      bottom.appendChild(actionChip({ a: "vanquish" }, canAct));
    }
    acts.appendChild(top);
    acts.appendChild(bottom);
    card.appendChild(acts);

    // Obstacle tokens (Gaston).
    if (loc.obstacles > 0) {
      const obox = el("div", "zone obstacle-zone");
      obox.appendChild(el("div", "zone-label", "Obstacles"));
      obox.appendChild(el("div", "obstacle-tokens", "🚧 ".repeat(loc.obstacles).trim()));
      card.appendChild(obox);
    }

    // Heroes.
    if (loc.heroes.length) {
      const hbox = el("div", "zone hero-zone");
      hbox.appendChild(el("div", "zone-label", "Heroes"));
      loc.heroes.forEach((h) => hbox.appendChild(tokenCard(h, "hero")));
      card.appendChild(hbox);
    }

    // Allies / items / placed cards.
    if (loc.cards.length) {
      const cbox = el("div", "zone card-zone");
      cbox.appendChild(el("div", "zone-label", "In play"));
      loc.cards.forEach((c) => cbox.appendChild(tokenCard(c, c.type)));
      card.appendChild(cbox);
    }

    // Move-here button (not for locked locations).
    if (game.phase === "move" && !isHere && !loc.locked) {
      const mv = el("button", "btn btn-move", "Move here");
      mv.addEventListener("click", () => {
        const r = moveMover(game, i);
        if (!r.ok) alert(r.error);
        render();
      });
      card.appendChild(mv);
    }

    realm.appendChild(card);
  });
  return realm;
}

function actionChip(action, active) {
  const used =
    active && game.usedActions.includes(action.a + (action.n != null ? ":" + action.n : ""));
  const chip = el(
    "button",
    "act-chip" + (active && !used ? " active" : "") + (used ? " used" : ""),
    `${ACTION_ICONS[action.a]} ${ACTION_LABELS[action.a]}${
      action.n != null ? " " + action.n : ""
    }`
  );
  if (active && !used) {
    chip.addEventListener("click", () => doAction(action));
  } else {
    chip.disabled = true;
  }
  return chip;
}

function tokenCard(c, kind) {
  const subCls = c.subtype ? " sub-" + c.subtype : "";
  const t = el("div", "token token-" + kind + subCls);
  // Show Burr's Political Influence count right on the tracker item.
  const influence =
    c.subtype === "influence"
      ? `<div class="tok-str">🏛️ ${currentPlayer(game).politicalInfluence}/10</div>`
      : "";
  t.innerHTML = `
    <div class="tok-name">${c.name}</div>
    ${c.strength != null ? `<div class="tok-str">💪 ${c.strength}</div>` : ""}
    ${influence}
    <div class="tok-text">${c.text || ""}</div>`;
  return t;
}

function renderSidebar(p) {
  const side = el("div", "sidebar");

  // Opponents summary.
  const opp = el("div", "panel");
  opp.appendChild(el("div", "panel-title", "Opponents"));
  game.players.forEach((o) => {
    if (o.index === p.index) return;
    const v = VILLAINS[o.villainKey];
    const row = el("div", "opp-row");
    row.style.setProperty("--vc", v.color);
    const heroes = o.board.reduce((n, l) => n + l.heroes.length, 0);
    row.innerHTML = `
      <span class="opp-heart">${v.heart}</span>
      <span class="opp-name">${o.name}</span>
      <span class="opp-stats">⚡${o.power} · 🦸${heroes} · 🃏${o.hand.length}</span>`;
    opp.appendChild(row);
  });
  side.appendChild(opp);

  // Log.
  const log = el("div", "panel log-panel");
  log.appendChild(el("div", "panel-title", "Game Log"));
  const list = el("div", "log-list");
  game.log.forEach((entry) =>
    list.appendChild(el("div", "log-entry", `<b>T${entry.turn}</b> ${entry.msg}`))
  );
  log.appendChild(list);
  side.appendChild(log);

  return side;
}

function renderHand(p) {
  const hand = el("div", "hand");
  hand.appendChild(el("div", "hand-label", `Hand (${p.hand.length}) · Deck ${p.deck.length} · Discard ${p.discard.length}`));
  const cards = el("div", "hand-cards");
  if (!p.hand.length) cards.appendChild(el("div", "muted", "No cards in hand."));
  p.hand.forEach((c) => {
    const subCls = c.subtype ? " sub-" + c.subtype : "";
    const card = el("div", "play-card type-" + c.type + subCls);
    const conditionHint =
      c.type === "condition"
        ? `<div class="pc-flag">⏱ Can be played during another player's turn</div>`
        : "";
    card.innerHTML = `
      <div class="pc-cost">⚡${c.cost || 0}</div>
      <div class="pc-name">${c.name}</div>
      <div class="pc-type">${c.type}${c.strength != null ? " · 💪" + c.strength : ""}</div>
      <div class="pc-text">${c.text || ""}</div>
      ${conditionHint}`;
    cards.appendChild(card);
  });
  hand.appendChild(cards);
  return hand;
}

// ---- action dispatch ----------------------------------------------

function doAction(action) {
  const p = currentPlayer(game);
  switch (action.a) {
    case "power": {
      const r = actGainPower(game, action);
      if (!r.ok) alert(r.error);
      break;
    }
    case "play":
      return doPlayCard(action);
    case "vanquish":
      return doVanquish(action);
    case "fate":
      return doFate(action);
    case "moveAllyItem":
      return doMoveAllyItem(action);
    case "moveHero":
      return doMoveHero(action);
    case "discard":
      return doDiscard(action);
    case "activate": {
      const r = actActivate(game, action);
      if (!r.ok) alert(r.error);
      break;
    }
  }
  afterAction(p);
}

function afterAction(p) {
  refreshLocks(game, p); // condition-based unlocks (e.g. Voldemort's Hogwarts)
  checkWin(game, p); // some objectives (e.g. power) can flip mid-turn
  render();
}

function doPlayCard(action) {
  const p = currentPlayer(game);
  const playable = p.hand.filter((c) => (c.cost || 0) <= p.power);
  if (!playable.length) return alert("No affordable cards in hand.");
  const choice = prompt(
    "Play which card? Enter the number:\n\n" +
      playable
        .map((c, i) => `${i + 1}. ${c.name} (⚡${c.cost || 0}) — ${c.text}`)
        .join("\n")
  );
  if (!choice) return;
  const card = playable[parseInt(choice, 10) - 1];
  if (!card) return;

  let locIndex = p.moverLocation;
  const placeable =
    card.place || ["ally", "item", "condition"].includes(card.type);
  if (placeable) {
    locIndex = pickLocation(p, `Place ${card.name} at which location?`);
    if (locIndex == null) return;
  }
  const r = actPlayCard(game, action, card.id, locIndex);
  if (!r.ok) return alert(r.error);
  // Cards that instantly defeat a Hero (White Rose, Plague Spell, Morsmordre).
  if (card.defeatHeroEffect) doInstantDefeat(card);
  afterAction(p);
}

// Choose a Hero in your Realm to instantly defeat (excludes the final boss;
// honors a Strength cap like Morsmordre's "Strength 4 or less").
function doInstantDefeat(card) {
  const p = currentPlayer(game);
  const cap = card && card.defeatHeroMaxStrength;
  const targets = [];
  p.board.forEach((l) =>
    l.heroes.forEach((h) => {
      if (h.winOnDefeat) return;
      if (cap != null && (h.strength || 0) > cap) return;
      targets.push({ h, loc: l.name });
    })
  );
  if (!targets.length)
    return alert(
      cap != null
        ? `No eligible Heroes (Strength ${cap} or less) in your Realm.`
        : "No eligible Heroes in your Realm to defeat."
    );
  const c = prompt(
    "Instantly defeat which Hero?\n" +
      targets
        .map((t, i) => `${i + 1}. ${t.h.name} (💪${t.h.strength}) at ${t.loc}`)
        .join("\n")
  );
  const sel = targets[parseInt(c, 10) - 1];
  if (!sel) return;
  const r = instantDefeatHero(game, sel.h.id, cap);
  if (!r.ok) alert(r.error);
}

function doVanquish(action) {
  const p = currentPlayer(game);
  const loc = p.board[p.moverLocation];
  if (!loc.heroes.length) return alert("No Heroes at your location to vanquish.");
  const allies = loc.cards.filter((c) => c.type === "ally");
  if (!allies.length) return alert("You need Allies here to vanquish.");

  const hero =
    loc.heroes.length === 1
      ? loc.heroes[0]
      : loc.heroes[
          parseInt(
            prompt(
              "Vanquish which Hero?\n" +
                loc.heroes.map((h, i) => `${i + 1}. ${h.name} (💪${h.strength})`).join("\n")
            ),
            10
          ) - 1
        ];
  if (!hero) return;

  const chosen = prompt(
    `Use which Allies? (need total 💪 ≥ ${hero.strength})\n` +
      "Enter numbers separated by commas:\n" +
      allies.map((a, i) => `${i + 1}. ${a.name} (💪${a.strength})`).join("\n")
  );
  if (!chosen) return;
  const ids = chosen
    .split(",")
    .map((s) => allies[parseInt(s.trim(), 10) - 1])
    .filter(Boolean)
    .map((a) => a.id);

  const r = actVanquish(game, action, hero.id, ids);
  if (!r.ok) alert(r.error);
  afterAction(p);
}

function doFate(action) {
  const p = currentPlayer(game);
  const opponents = game.players.filter((o) => o.index !== p.index);
  let target;
  if (opponents.length === 1) target = opponents[0];
  else {
    const c = prompt(
      "Fate which opponent?\n" +
        opponents.map((o, i) => `${i + 1}. ${o.name}`).join("\n")
    );
    target = opponents[parseInt(c, 10) - 1];
  }
  if (!target) return;
  const r = actFateDraw(game, action, target.index);
  if (!r.ok) return alert(r.error);
  pendingFate = { drawn: r.drawn, targetIndex: r.targetIndex };
  render();
}

// Top actions are the ones a Hero covers when placed at a location.
function blockableLabel(loc) {
  if (loc.heroes.length) return "top actions already blocked";
  if (!loc.topActions.length) return "nothing to block";
  return (
    "blocks " +
    loc.topActions
      .map((a) => ACTION_ICONS[a.a] + ACTION_LABELS[a.a] + (a.n != null ? " " + a.n : ""))
      .join(", ")
  );
}

function renderFateChooser() {
  const overlay = el("div", "overlay");
  const box = el("div", "modal");
  const target = game.players[pendingFate.targetIndex];
  box.appendChild(el("h2", null, `Fate ${target.name} — choose one to play`));

  // Board preview: shows what each location's Heroes would block.
  const preview = el("div", "fate-preview");
  preview.appendChild(el("div", "fate-preview-label",
    `${target.name}'s locations — placing a Hero covers the top actions:`));
  target.board.forEach((loc) => {
    const heroesHere = loc.heroes.length
      ? " · 🦸 " + loc.heroes.map((h) => h.name).join(", ")
      : "";
    preview.appendChild(el("div", "fate-loc",
      `<b>${loc.locked ? "🔒 " : ""}${loc.name}</b> — <span class="fate-block">${blockableLabel(loc)}</span>${heroesHere}`));
  });
  box.appendChild(preview);

  const row = el("div", "fate-cards");
  pendingFate.drawn.forEach((c) => {
    const card = el("div", "play-card type-" + (c.type === "hero" ? "hero" : "effect"));
    const fixed = c.placeAt ? `<div class="pc-flag">📍 Always placed at: ${c.placeAt}</div>` : "";
    card.innerHTML = `
      <div class="pc-name">${c.name}</div>
      <div class="pc-type">${c.type}${c.strength != null ? " · 💪" + c.strength : ""}</div>
      <div class="pc-text">${c.text || ""}</div>
      ${fixed}`;
    card.addEventListener("click", () => {
      let li = 0;
      if (c.placeAt) {
        // Fixed-location Fate card (e.g. Queen Glory, IceWing Army).
        li = target.board.findIndex((l) => l.name === c.placeAt);
        if (li < 0) li = 0;
      } else if (c.type === "hero") {
        li = pickFateLocation(target, c.name);
        if (li == null) return;
      }
      resolveFate(game, pendingFate.targetIndex, c.id, pendingFate.drawn, li);
      pendingFate = null;
      afterAction(currentPlayer(game));
    });
    row.appendChild(card);
  });
  box.appendChild(row);
  overlay.appendChild(box);
  return overlay;
}

// Location picker for Fate that spells out what each placement blocks.
function pickFateLocation(target, heroName) {
  const c = prompt(
    `Place ${heroName} on which of ${target.name}'s locations?\n` +
      "(A Hero covers that location's TOP actions)\n\n" +
      target.board
        .map((l, i) => `${i + 1}. ${l.name} — ${blockableLabel(l)}`)
        .join("\n")
  );
  if (!c) return null;
  const idx = parseInt(c, 10) - 1;
  if (idx < 0 || idx >= target.board.length) return null;
  return idx;
}

function doMoveAllyItem(action) {
  const p = currentPlayer(game);
  const movable = [];
  p.board.forEach((loc, li) =>
    loc.cards
      .filter((c) => c.type === "ally" || c.type === "item")
      .forEach((c) => movable.push({ c, li, locName: loc.name }))
  );
  if (!movable.length) return alert("No Allies or Items to move.");
  const c = prompt(
    "Move which Ally/Item?\n" +
      movable.map((m, i) => `${i + 1}. ${m.c.name} (at ${m.locName})`).join("\n")
  );
  const sel = movable[parseInt(c, 10) - 1];
  if (!sel) return;
  const to = pickLocation(p, `Move ${sel.c.name} to which location?`);
  if (to == null) return;
  const r = actMoveAllyItem(game, action, sel.c.id, to);
  if (!r.ok) alert(r.error);
  afterAction(p);
}

function doMoveHero(action) {
  const p = currentPlayer(game);
  const movable = [];
  p.board.forEach((loc) =>
    loc.heroes.forEach((h) => movable.push({ h, locName: loc.name }))
  );
  if (!movable.length) return alert("No Heroes in your realm to move.");
  const c = prompt(
    "Move which Hero?\n" +
      movable.map((m, i) => `${i + 1}. ${m.h.name} (at ${m.locName})`).join("\n")
  );
  const sel = movable[parseInt(c, 10) - 1];
  if (!sel) return;
  const to = pickLocation(p, `Move ${sel.h.name} to which location?`);
  if (to == null) return;
  const r = actMoveHero(game, action, sel.h.id, to);
  if (!r.ok) alert(r.error);
  afterAction(p);
}

function doDiscard(action) {
  const p = currentPlayer(game);
  if (!p.hand.length) return alert("No cards to discard.");
  const c = prompt(
    "Discard which cards? Enter numbers separated by commas:\n" +
      p.hand.map((card, i) => `${i + 1}. ${card.name}`).join("\n")
  );
  if (!c) return;
  const ids = c
    .split(",")
    .map((s) => p.hand[parseInt(s.trim(), 10) - 1])
    .filter(Boolean)
    .map((card) => card.id);
  const r = actDiscard(game, action, ids);
  if (!r.ok) return alert(r.error);
  afterAction(p); // re-render so the new hand is visible
  if (r.drew) {
    const fresh = p.hand.slice(-r.drew).map((card) => card.name).join(", ");
    alert(`Discarded ${r.drew} and drew ${r.drew} new card(s):\n${fresh}\n\nYour new hand is shown below.`);
  }
}

function pickLocation(player, message) {
  const c = prompt(
    message +
      "\n" +
      player.board.map((l, i) => `${i + 1}. ${l.name}`).join("\n")
  );
  if (!c) return null;
  const idx = parseInt(c, 10) - 1;
  if (idx < 0 || idx >= player.board.length) return null;
  return idx;
}

function renderWinner() {
  const root = $("#app");
  root.innerHTML = "";
  const w = game.players[game.winner];
  const v = VILLAINS[w.villainKey];
  const box = el("div", "winner");
  box.style.setProperty("--vc", v.color);
  box.innerHTML = `
    <div class="win-heart">${v.heart}</div>
    <h1>${w.name} Wins!</h1>
    <p class="win-title">${v.title}</p>
    <p class="win-obj">🎯 ${v.objectiveText}</p>`;
  const again = el("button", "btn btn-primary", "Play Again");
  again.addEventListener("click", () => {
    game = null;
    setup = { count: 2, picks: [] };
    renderSetup();
  });
  box.appendChild(again);
  root.appendChild(box);
}

// ---- boot ----------------------------------------------------------
window.addEventListener("DOMContentLoaded", renderSetup);
