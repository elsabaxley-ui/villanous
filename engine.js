/*
 * Villainous — game engine
 * ------------------------------------------------------------------
 * Pure-ish state machine. All game state lives in a single `game`
 * object so it can later be serialized and synced over a network for
 * online multiplayer (the UI never stores state of its own).
 */

// ---- utilities -----------------------------------------------------

let _idCounter = 1;
function uid() {
  return "c" + _idCounter++;
}

function shuffle(arr) {
  // Fisher–Yates. Math.random is fine for a hot-seat game.
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- player / game construction ------------------------------------

function makePlayer(villainKey, index) {
  const v = VILLAINS[villainKey];
  const deck = shuffle(v.deck.map((c) => ({ ...c, id: uid() })));
  const fateDeck = shuffle(v.fateDeck.map((c) => ({ ...c, id: uid() })));

  const player = {
    index,
    villainKey,
    name: v.name,
    power: 0,
    deck,
    hand: [],
    discard: [],
    fateDeck,
    fateDiscard: [],
    moverLocation: 0,
    board: v.locations.map((loc) => ({
      name: loc.name,
      topActions: loc.topActions,
      bottomActions: loc.bottomActions,
      cards: [], // allies / items / effects placed here
      heroes: [], // fate heroes placed here
    })),
    flags: {}, // objective flags (defeatedPeterPan, keptTemper, etc.)
    won: false,
  };

  // Starting hand of 4.
  drawCards(player, 4);
  return player;
}

function newGame(villainKeys) {
  const game = {
    players: villainKeys.map((k, i) => makePlayer(k, i)),
    current: 0,
    turn: 1,
    phase: "move", // move -> actions -> end
    usedActions: [], // action keys used this turn at current location
    moved: false,
    log: [],
    winner: null,
  };
  logMsg(game, `Game started with ${villainKeys.length} villains.`);
  logMsg(game, `${game.players[0].name}'s turn.`);
  return game;
}

function currentPlayer(game) {
  return game.players[game.current];
}

function logMsg(game, msg) {
  game.log.unshift({ turn: game.turn, msg });
  if (game.log.length > 60) game.log.pop();
}

// ---- card movement -------------------------------------------------

function drawCards(player, n) {
  for (let i = 0; i < n; i++) {
    if (player.deck.length === 0) {
      // Reshuffle discard into deck.
      if (player.discard.length === 0) break;
      player.deck = shuffle(player.discard);
      player.discard = [];
    }
    player.hand.push(player.deck.pop());
  }
}

// ---- turn flow -----------------------------------------------------

function availableActionsAt(player, locIndex) {
  const loc = player.board[locIndex];
  const heroPresent = loc.heroes.length > 0;
  // Hero covers the top actions; only bottom available when present.
  return heroPresent
    ? loc.bottomActions
    : [...loc.topActions, ...loc.bottomActions];
}

function moveMover(game, locIndex) {
  const p = currentPlayer(game);
  if (game.phase !== "move") return fail("You have already moved this turn.");
  if (locIndex === p.moverLocation)
    return fail("You must move to a DIFFERENT location.");
  p.moverLocation = locIndex;
  game.moved = true;
  game.phase = "actions";
  game.usedActions = [];
  logMsg(game, `${p.name} moved to ${p.board[locIndex].name}.`);
  return ok();
}

function actionKey(action) {
  return action.a + (action.n != null ? ":" + action.n : "");
}

function isActionAvailable(game, action) {
  const p = currentPlayer(game);
  if (game.phase !== "actions") return false;
  const avail = availableActionsAt(p, p.moverLocation);
  const key = actionKey(action);
  const existsHere = avail.some((x) => actionKey(x) === key);
  const alreadyUsed = game.usedActions.includes(key);
  return existsHere && !alreadyUsed;
}

function markActionUsed(game, action) {
  game.usedActions.push(actionKey(action));
}

// Generic "Gain Power" action.
function actGainPower(game, action) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("That action isn't available.");
  p.power += action.n;
  markActionUsed(game, action);
  logMsg(game, `${p.name} gained ${action.n} Power (now ${p.power}).`);
  return ok();
}

// Play a card from hand. For cards that get placed, locIndex is required.
function actPlayCard(game, action, cardId, locIndex) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Play action isn't available.");
  const idx = p.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return fail("Card not in hand.");
  const card = p.hand[idx];
  if ((card.cost || 0) > p.power)
    return fail(`Not enough Power (need ${card.cost}, have ${p.power}).`);

  p.power -= card.cost || 0;
  p.hand.splice(idx, 1);

  // Auto effects.
  if (card.auto) {
    if (card.auto.power) {
      p.power += card.auto.power;
    }
    if (card.auto.draw) {
      drawCards(p, card.auto.draw);
    }
  }

  const placeable =
    card.place ||
    card.type === "ally" ||
    card.type === "item" ||
    card.type === "condition";

  if (placeable) {
    const li = locIndex != null ? locIndex : p.moverLocation;
    p.board[li].cards.push(card);
    logMsg(game, `${p.name} played ${card.name} to ${p.board[li].name}.`);
  } else {
    // One-shot effect -> discard.
    p.discard.push(card);
    logMsg(game, `${p.name} played ${card.name}.`);
  }

  markActionUsed(game, action);
  return ok({ card });
}

// Vanquish a hero at the current location using allies there.
function actVanquish(game, action, heroId, allyIds) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Vanquish isn't available here.");
  const loc = p.board[p.moverLocation];
  const hero = loc.heroes.find((h) => h.id === heroId);
  if (!hero) return fail("Hero not at this location.");
  const allies = loc.cards.filter(
    (c) => c.type === "ally" && allyIds.includes(c.id)
  );
  const totalStrength = allies.reduce((s, a) => s + (a.strength || 0), 0);
  if (totalStrength < hero.strength)
    return fail(
      `Need Strength ≥ ${hero.strength}; selected allies total ${totalStrength}.`
    );

  // Remove hero -> fate discard of the hero's owner.
  loc.heroes = loc.heroes.filter((h) => h.id !== heroId);
  const owner = hero.ownerIndex != null ? game.players[hero.ownerIndex] : p;
  owner.fateDiscard.push(hero);

  // Allies used are discarded.
  loc.cards = loc.cards.filter((c) => !allyIds.includes(c.id));
  allies.forEach((a) => p.discard.push(a));

  logMsg(
    game,
    `${p.name} vanquished ${hero.name} (Str ${hero.strength}) using ${allies
      .map((a) => a.name)
      .join(", ")}.`
  );

  // Captain Hook objective hook.
  if (hero.isPeterPan && loc.name === "Jolly Roger") {
    p.flags.defeatedPeterPan = true;
    logMsg(game, `${p.name} defeated Peter Pan at the Jolly Roger!`);
  }

  markActionUsed(game, action);
  return ok();
}

// Fate: draw 2 from a target opponent's fate deck, play one on them.
function actFateDraw(game, action, targetIndex) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Fate isn't available here.");
  const target = game.players[targetIndex];
  if (!target || target === p) return fail("Choose an opponent to Fate.");
  const drawn = [];
  for (let i = 0; i < 2; i++) {
    if (target.fateDeck.length === 0) {
      if (target.fateDiscard.length === 0) break;
      target.fateDeck = shuffle(target.fateDiscard);
      target.fateDiscard = [];
    }
    drawn.push(target.fateDeck.pop());
  }
  markActionUsed(game, action);
  logMsg(game, `${p.name} drew Fate cards against ${target.name}.`);
  // Returns drawn cards; UI lets player choose one to place and discards rest.
  return ok({ drawn, targetIndex });
}

// Resolve a Fate choice: place chosen card on target, discard the rest.
function resolveFate(game, targetIndex, chosenId, drawn, placeLocIndex) {
  const target = game.players[targetIndex];
  const chosen = drawn.find((c) => c.id === chosenId);
  drawn.forEach((c) => {
    if (c.id !== chosenId) target.fateDiscard.push(c);
  });
  if (!chosen) return ok();
  const li = placeLocIndex != null ? placeLocIndex : 0;
  chosen.ownerIndex = targetIndex;
  if (chosen.type === "hero") {
    target.board[li].heroes.push(chosen);
    logMsg(
      game,
      `${currentPlayer(game).name} placed ${chosen.name} at ${target.name}'s ${
        target.board[li].name
      }.`
    );
  } else {
    target.board[li].cards.push(chosen);
    logMsg(game, `${currentPlayer(game).name} played ${chosen.name} on ${target.name}.`);
  }
  return ok({ chosen });
}

// Move an ally or item between this player's locations.
function actMoveAllyItem(game, action, cardId, toLocIndex) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Move isn't available here.");
  for (const loc of p.board) {
    const i = loc.cards.findIndex((c) => c.id === cardId);
    if (i !== -1) {
      const [card] = loc.cards.splice(i, 1);
      p.board[toLocIndex].cards.push(card);
      logMsg(game, `${p.name} moved ${card.name} to ${p.board[toLocIndex].name}.`);
      markActionUsed(game, action);
      return ok();
    }
  }
  return fail("Card not found in your realm.");
}

// Move a hero between this player's locations.
function actMoveHero(game, action, heroId, toLocIndex) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Move Hero isn't available here.");
  for (const loc of p.board) {
    const i = loc.heroes.findIndex((h) => h.id === heroId);
    if (i !== -1) {
      const [hero] = loc.heroes.splice(i, 1);
      p.board[toLocIndex].heroes.push(hero);
      logMsg(game, `${p.name} moved ${hero.name} to ${p.board[toLocIndex].name}.`);
      markActionUsed(game, action);
      return ok();
    }
  }
  return fail("Hero not found in your realm.");
}

// Discard chosen cards from hand.
function actDiscard(game, action, cardIds) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Discard isn't available here.");
  cardIds.forEach((id) => {
    const i = p.hand.findIndex((c) => c.id === id);
    if (i !== -1) p.discard.push(p.hand.splice(i, 1)[0]);
  });
  markActionUsed(game, action);
  logMsg(game, `${p.name} discarded ${cardIds.length} card(s).`);
  return ok();
}

// Generic "Activate" — left to manual resolution; just marks used.
function actActivate(game, action) {
  const p = currentPlayer(game);
  if (!isActionAvailable(game, action)) return fail("Activate isn't available here.");
  markActionUsed(game, action);
  logMsg(game, `${p.name} used an Activate ability (resolve manually).`);
  return ok();
}

function endTurn(game) {
  const p = currentPlayer(game);
  // Draw back up to 4.
  const need = 4 - p.hand.length;
  if (need > 0) drawCards(p, need);

  game.current = (game.current + 1) % game.players.length;
  if (game.current === 0) game.turn++;
  game.phase = "move";
  game.moved = false;
  game.usedActions = [];

  const np = currentPlayer(game);
  logMsg(game, `${np.name}'s turn (turn ${game.turn}).`);

  // Win check at the start of the new player's turn.
  checkWin(game, np);
  return ok();
}

function checkWin(game, player) {
  const v = VILLAINS[player.villainKey];
  if (v.objective(player)) {
    player.won = true;
    game.winner = player.index;
    logMsg(game, `🏆 ${player.name} achieved their objective and WINS!`);
    return true;
  }
  return false;
}

// ---- result helpers ------------------------------------------------

function ok(data) {
  return { ok: true, ...(data || {}) };
}
function fail(error) {
  return { ok: false, error };
}
