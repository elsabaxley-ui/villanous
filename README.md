# Villainous Online

A browser-based, local **hot-seat** version of Disney *Villainous* — pick 2–6 villains
and pass the device on each turn. Pure vanilla HTML/CSS/JS, no build step.

## How to play

Just open `index.html` in a browser (double-click it, or run a tiny local server):

```bash
# optional local server
python3 -m http.server 8000
# then visit http://localhost:8000
```

1. **Pick 2–6 villains** on the setup screen, then **Start Game**.
2. On your turn: **Move** your mover to a *different* location, then click the
   available **action symbols** at that location (Gain Power, Play a Card, Fate,
   Vanquish, etc.). A Hero at a location covers its top actions.
3. **End Turn** to draw back up to 4 cards and pass to the next player.
4. First villain to complete their **objective** (shown top-right) wins.

## The 10 villains & objectives

| Villain | Objective |
|---|---|
| Maleficent 🐉 | Start your turn with a Curse at each of your 4 locations |
| Captain Hook 🪝 | Defeat Peter Pan at the Jolly Roger |
| Prince John 💰 | Start your turn with at least 20 Power |
| Queen of Hearts 🃏 | A Wicket at every location + keep your temper |
| Ursula 🐙 | Trident and Crown at Ursula's Lair |
| Jafar 🪔 | Magic Lamp at the Sultan's Palace + Genie under control |
| Scar 🦁 | 15+ Strength in the Succession Pile (defeated heroes) |
| Cruella De Vil 🐕 | Capture 99+ puppies |
| Dr. Facilier 🎩 | Play the Talisman + Rule New Orleans |
| Gaston 💪 | Remove all 8 Obstacle tokens |

Locked locations: Hangman's Tree (Hook), Cave of Wonders (Jafar), The Palace (Ursula).

## Project structure

- `index.html` — page shell, loads the scripts in order
- `data.js` — all villain/realm/card data (curated decks; easy to edit & expand)
- `engine.js` — game state machine (single serializable `game` object)
- `ui.js` — rendering + interaction
- `styles.css` — theming

## Status / scope (honest notes)

This is a **functional digital tabletop**, not a full rules-automated engine:

- Decks are **curated** (iconic + objective-critical cards), not the full ~30-card
  official decks. Add cards in `data.js`.
- Location **action layouts** are sensible approximations — refine against the
  physical board.
- Many card abilities marked "resolve manually" are shown as text for players to
  adjudicate (normal for hot-seat ports). Common effects (gain power, draw,
  place objective items, vanquish, fate) **are** automated.
- State lives in one object (`engine.js`) so **online multiplayer** can be added
  later by syncing it — no engine rewrite needed.

## Roadmap

- [ ] Expand decks toward full official card sets
- [ ] Automate more card abilities
- [ ] Replace `prompt()` dialogs with click/drag card selection
- [ ] Optional networked multiplayer
