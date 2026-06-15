/*
 * Villainous — UI layer
 * ------------------------------------------------------------------
 * Renders the single `game` state object and wires up player actions.
 * Holds no game state of its own (only transient selection state).
 */

let game = null;
let setup = { count: 2, picks: [] };
let pendingFate = null; // { drawn, targetIndex } awaiting a choice

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
  const wrap = el("div", "setup");
  wrap.appendChild(el("h1", "title", "Villainous <span>Online</span>"));
  wrap.appendChild(
    el("p", "subtitle", "Local hot-seat — pick 2–6 villains, then pass the device on each turn.")
  );

  const grid = el("div", "villain-grid");
  VILLAIN_ORDER.forEach((key) => {
    const v = VILLAINS[key];
    const card = el("div", "villain-pick");
    card.style.setProperty("--vc", v.color);
    card.innerHTML = `
      <div class="vp-heart">${v.heart}</div>
      <div class="vp-name">${v.name}</div>
      <div class="vp-title">${v.title}</div>
      <div class="vp-obj">🎯 ${v.objectiveText}</div>
      <div class="vp-badge"></div>`;
    card.addEventListener("click", () => togglePick(key, card));
    card.dataset.key = key;
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const bar = el("div", "setup-bar");
  const start = el("button", "btn btn-primary", "Start Game");
  start.id = "start-btn";
  start.disabled = true;
  start.addEventListener("click", startGame);
  bar.appendChild(el("div", "pick-hint", "Select 2–6 villains"));
  bar.appendChild(start);
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
  if (hint)
    hint.textContent =
      setup.picks.length < 2
        ? `Select 2–6 villains (${setup.picks.length} chosen)`
        : `${setup.picks.length} villains ready`;
}

function startGame() {
  game = newGame(setup.picks);
  render();
}

// ---- main game render ----------------------------------------------

function render() {
  if (game.winner != null) return renderWinner();
  const root = $("#app");
  root.innerHTML = "";
  const p = currentPlayer(game);

  root.appendChild(renderTopBar(p));
  const main = el("div", "main");
  main.appendChild(renderRealm(p));
  main.appendChild(renderSidebar(p));
  root.appendChild(main);
  root.appendChild(renderHand(p));
  if (pendingFate) root.appendChild(renderFateChooser());
}

function renderTopBar(p) {
  const v = VILLAINS[p.villainKey];
  const bar = el("div", "topbar");
  bar.style.setProperty("--vc", v.color);
  bar.innerHTML = `
    <div class="tb-left">
      <span class="tb-heart">${v.heart}</span>
      <div>
        <div class="tb-name">${p.name}</div>
        <div class="tb-title">${v.title}</div>
      </div>
    </div>
    <div class="tb-mid">
      <div class="tb-power">⚡ <b>${p.power}</b> Power</div>
      <div class="tb-phase">Turn ${game.turn} · ${
    game.phase === "move" ? "Move your mover" : "Take actions"
  }</div>
    </div>`;
  const right = el("div", "tb-right");
  const objBtn = el("button", "btn btn-ghost", "🎯 Objective");
  objBtn.addEventListener("click", () =>
    alert(`${p.name}'s objective:\n\n${v.objectiveText}`)
  );
  const endBtn = el("button", "btn btn-primary", "End Turn ▶");
  endBtn.disabled = !game.moved;
  endBtn.title = game.moved ? "" : "Move your mover first";
  endBtn.addEventListener("click", () => {
    endTurn(game);
    render();
  });
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
    const card = el("div", "location" + (isHere ? " here" : ""));
    card.appendChild(el("div", "loc-head",
      `<span class="loc-name">${loc.name}</span>${
        isHere ? '<span class="loc-mover">🦹 You are here</span>' : ""
      }`));

    // Action symbols.
    const acts = el("div", "loc-actions");
    const top = el("div", "act-row" + (heroPresent ? " covered" : ""));
    loc.topActions.forEach((a) => top.appendChild(actionChip(a, isHere && !heroPresent)));
    const bottom = el("div", "act-row");
    loc.bottomActions.forEach((a) => bottom.appendChild(actionChip(a, isHere)));
    acts.appendChild(top);
    acts.appendChild(bottom);
    card.appendChild(acts);

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

    // Move-here button.
    if (game.phase === "move" && !isHere) {
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
  const t = el("div", "token token-" + kind);
  t.innerHTML = `
    <div class="tok-name">${c.name}</div>
    ${c.strength != null ? `<div class="tok-str">💪 ${c.strength}</div>` : ""}
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
    const card = el("div", "play-card type-" + c.type);
    card.innerHTML = `
      <div class="pc-cost">⚡${c.cost || 0}</div>
      <div class="pc-name">${c.name}</div>
      <div class="pc-type">${c.type}${c.strength != null ? " · 💪" + c.strength : ""}</div>
      <div class="pc-text">${c.text || ""}</div>`;
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
  if (!r.ok) alert(r.error);
  afterAction(p);
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

function renderFateChooser() {
  const overlay = el("div", "overlay");
  const box = el("div", "modal");
  const target = game.players[pendingFate.targetIndex];
  box.appendChild(el("h2", null, `Fate ${target.name} — choose one to play`));
  const row = el("div", "fate-cards");
  pendingFate.drawn.forEach((c) => {
    const card = el("div", "play-card type-" + (c.type === "hero" ? "hero" : "effect"));
    card.innerHTML = `
      <div class="pc-name">${c.name}</div>
      <div class="pc-type">${c.type}${c.strength != null ? " · 💪" + c.strength : ""}</div>
      <div class="pc-text">${c.text || ""}</div>`;
    card.addEventListener("click", () => {
      let li = 0;
      if (c.type === "hero") {
        li = pickLocation(target, `Place ${c.name} at which of ${target.name}'s locations?`);
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
  if (!r.ok) alert(r.error);
  afterAction(p);
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
