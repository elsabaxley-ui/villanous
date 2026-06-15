/*
 * Villainous — game data
 * ------------------------------------------------------------------
 * All 6 base-set villains: their realm (4 locations), objective (win
 * condition), villain deck and fate deck.
 *
 * NOTE: Decks are CURATED (the iconic / objective-critical cards), not
 * the full ~30-card official decks. Location action layouts are sensible
 * approximations meant to be refined against the physical board. Every
 * value here is plain data — easy to edit and expand later.
 *
 * Action symbol codes used in locations:
 *   power        Gain Power (amount)
 *   play         Play a Card
 *   activate     Activate an ability
 *   fate         Fate (an opponent)
 *   moveAllyItem Move an Ally or Item
 *   moveHero     Move a Hero
 *   vanquish     Vanquish a Hero
 *   discard      Discard Cards
 *
 * Rule modelled: when a Hero is at a location it covers the TOP actions,
 * so only the BOTTOM actions are available there.
 */

const ACTION_LABELS = {
  power: "Gain Power",
  play: "Play a Card",
  activate: "Activate",
  fate: "Fate",
  moveAllyItem: "Move Ally/Item",
  moveHero: "Move a Hero",
  vanquish: "Vanquish",
  discard: "Discard Cards",
};

const ACTION_ICONS = {
  power: "⚡",
  play: "🃏",
  activate: "✨",
  fate: "🎴",
  moveAllyItem: "➡️",
  moveHero: "🦶",
  vanquish: "⚔️",
  discard: "🗑️",
};

// Helper to build N copies of a card definition.
function copies(n, card) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ ...card });
  return out;
}

const VILLAINS = {
  maleficent: {
    key: "maleficent",
    name: "Maleficent",
    title: "The Mistress of All Evil",
    color: "#7b2fa8",
    heart: "💜",
    objectiveText:
      "Start your turn with a Curse at each of the four locations in your realm.",
    objective: (P) =>
      P.board.every((loc) =>
        loc.cards.some((c) => c.subtype === "curse")
      ),
    locations: [
      {
        name: "Forbidden Mountains",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "fate" }],
      },
      {
        name: "Briar Rose's Cottage",
        topActions: [{ a: "play" }, { a: "moveAllyItem" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "discard" }],
      },
      {
        name: "The Forest",
        topActions: [{ a: "power", n: 2 }, { a: "fate" }],
        bottomActions: [{ a: "play" }, { a: "vanquish" }],
      },
      {
        name: "King Stefan's Castle",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveHero" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Raven", type: "ally", cost: 1, strength: 1,
        text: "A loyal companion. Strength 1." }),
      ...copies(3, { name: "Goon", type: "ally", cost: 2, strength: 2,
        text: "Maleficent's foot soldier. Strength 2." }),
      ...copies(3, { name: "Curse", type: "effect", subtype: "curse", cost: 2,
        text: "Place this Curse at a location in your realm. Counts toward your objective.",
        place: true }),
      ...copies(2, { name: "Dragon Form", type: "ally", cost: 4, strength: 6,
        text: "Maleficent transforms. Strength 6." }),
      ...copies(2, { name: "Sinister Plot", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
      ...copies(2, { name: "Tyranny", type: "effect", cost: 0,
        text: "Gain 2 Power.", auto: { power: 2 } }),
      ...copies(2, { name: "Savor This Moment", type: "condition", cost: 0,
        text: "Reveal an objective bonus when triggered (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Prince Phillip", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(1, { name: "Flora", type: "hero", strength: 2,
        text: "A good fairy. Strength 2." }),
      ...copies(1, { name: "Fauna", type: "hero", strength: 2,
        text: "A good fairy. Strength 2." }),
      ...copies(1, { name: "Merryweather", type: "hero", strength: 2,
        text: "A good fairy. Strength 2." }),
      ...copies(2, { name: "Sword of Truth", type: "fateItem", strength: 0,
        text: "Attach to a Hero: +2 Strength (resolve manually)." }),
    ],
  },

  hook: {
    key: "hook",
    name: "Captain Hook",
    title: "The Captain of the Jolly Roger",
    color: "#b3122a",
    heart: "❤️",
    objectiveText:
      "Defeat Peter Pan at the Jolly Roger.",
    // Win flag is set by the engine when Peter Pan is vanquished at the
    // Jolly Roger; checked here.
    objective: (P) => !!P.flags.defeatedPeterPan,
    locations: [
      {
        name: "Jolly Roger",
        topActions: [{ a: "play" }, { a: "vanquish" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveHero" }],
      },
      {
        name: "Skull Rock",
        topActions: [{ a: "power", n: 2 }, { a: "fate" }],
        bottomActions: [{ a: "play" }, { a: "discard" }],
      },
      {
        name: "Mermaid Lagoon",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "activate" }],
      },
      {
        name: "Hangman's Tree",
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Pirate", type: "ally", cost: 1, strength: 1,
        text: "Crew of the Jolly Roger. Strength 1." }),
      ...copies(3, { name: "Mr. Smee", type: "ally", cost: 2, strength: 2,
        text: "Hook's bumbling first mate. Strength 2." }),
      ...copies(2, { name: "Cannon", type: "item", cost: 2,
        text: "Attach to an Ally: +2 Strength (resolve manually)." }),
      ...copies(2, { name: "Boarding Party", type: "ally", cost: 3, strength: 3,
        text: "A fierce raiding crew. Strength 3." }),
      ...copies(2, { name: "Cunning", type: "effect", cost: 0,
        text: "Gain 2 Power.", auto: { power: 2 } }),
      ...copies(2, { name: "Worthy Opponent", type: "effect", cost: 1,
        text: "Move a Hero to an adjacent location (resolve manually)." }),
      ...copies(2, { name: "Obsession", type: "condition", cost: 0,
        text: "If Peter Pan is in your realm, gain bonus Power (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Peter Pan", type: "hero", strength: 7,
        text: "Hero. Strength 7. Defeat him at the Jolly Roger to win!",
        isPeterPan: true }),
      ...copies(2, { name: "Lost Boys", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Tinker Bell", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
      ...copies(1, { name: "Tick Tock", type: "hero", strength: 4,
        text: "The crocodile. Strength 4." }),
      ...copies(1, { name: "Wendy", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
    ],
  },

  princejohn: {
    key: "princejohn",
    name: "Prince John",
    title: "The Phony King of England",
    color: "#1f7a3d",
    heart: "💚",
    objectiveText: "Start your turn with at least 20 Power.",
    objective: (P) => P.power >= 20,
    locations: [
      {
        name: "Sherwood Forest",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "fate" }, { a: "moveAllyItem" }],
      },
      {
        name: "Friar Tuck's Church",
        topActions: [{ a: "power", n: 1 }, { a: "activate" }],
        bottomActions: [{ a: "play" }, { a: "discard" }],
      },
      {
        name: "The Jail",
        topActions: [{ a: "power", n: 3 }, { a: "vanquish" }],
        bottomActions: [{ a: "play" }, { a: "moveHero" }],
      },
      {
        name: "Nottingham",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "fate" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Sheriff of Nottingham", type: "ally", cost: 2, strength: 2,
        text: "Collects taxes. Strength 2." }),
      ...copies(3, { name: "Rhino Guard", type: "ally", cost: 2, strength: 2,
        text: "Palace guard. Strength 2." }),
      ...copies(3, { name: "Taxes", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
      ...copies(2, { name: "Greed", type: "effect", cost: 1,
        text: "Gain 4 Power.", auto: { power: 4 } }),
      ...copies(2, { name: "Wineskin", type: "item", cost: 1,
        text: "Attach to a location: gain extra Power there (resolve manually)." }),
      ...copies(2, { name: "Bow and Arrow", type: "item", cost: 2,
        text: "Attach to an Ally: +1 Strength (resolve manually)." }),
      ...copies(2, { name: "Intimidation", type: "effect", cost: 1,
        text: "Move a Hero (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Robin Hood", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(2, { name: "Little John", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(1, { name: "Friar Tuck", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Maid Marian", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "King Richard", type: "hero", strength: 5,
        text: "Hero. Strength 5." }),
    ],
  },

  queenofhearts: {
    key: "queenofhearts",
    name: "Queen of Hearts",
    title: "Her Imperious Majesty",
    color: "#c0143c",
    heart: "❤️",
    objectiveText:
      "Have a Wicket at every location, then take a turn without losing your temper (resolve the temper roll manually).",
    objective: (P) =>
      P.board.every((loc) => loc.cards.some((c) => c.subtype === "wicket")) &&
      !!P.flags.keptTemper,
    locations: [
      {
        name: "Rose Garden",
        topActions: [{ a: "play" }, { a: "power", n: 1 }],
        bottomActions: [{ a: "fate" }, { a: "moveAllyItem" }],
      },
      {
        name: "Tulgey Wood",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "discard" }],
      },
      {
        name: "Croquet Grounds",
        topActions: [{ a: "play" }, { a: "vanquish" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveHero" }],
      },
      {
        name: "Queen's Castle",
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "activate" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Card Soldier", type: "ally", cost: 1, strength: 1,
        text: "A painted playing card. Strength 1." }),
      ...copies(4, { name: "Wicket", type: "item", subtype: "wicket", cost: 1,
        text: "Place a Wicket at a location. Counts toward your objective.",
        place: true }),
      ...copies(2, { name: "The Cheshire Cat", type: "ally", cost: 3, strength: 3,
        text: "Grinning trickster. Strength 3." }),
      ...copies(2, { name: "Off With Their Heads!", type: "effect", cost: 2,
        text: "Vanquish bonus / temper roll (resolve manually)." }),
      ...copies(2, { name: "A Trial", type: "effect", cost: 1,
        text: "Gain 2 Power.", auto: { power: 2 } }),
      ...copies(2, { name: "Flamingo", type: "item", cost: 1,
        text: "Croquet mallet. Attach to an Ally: +1 Strength (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Alice", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(2, { name: "The White Rabbit", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
      ...copies(1, { name: "The Mad Hatter", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "The March Hare", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Grow Bigger", type: "fateEffect",
        text: "Alice gains +Strength (resolve manually)." }),
    ],
  },

  ursula: {
    key: "ursula",
    name: "Ursula",
    title: "The Sea Witch",
    color: "#5a2d82",
    heart: "💜",
    objectiveText:
      "Have both King Triton's Trident and the Crown in your realm at the start of your turn.",
    objective: (P) =>
      P.board.some((loc) => loc.cards.some((c) => c.subtype === "trident")) &&
      P.board.some((loc) => loc.cards.some((c) => c.subtype === "crown")),
    locations: [
      {
        name: "Ursula's Lair",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "fate" }],
      },
      {
        name: "Eric's Ship",
        topActions: [{ a: "play" }, { a: "vanquish" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveHero" }],
      },
      {
        name: "Triton's Palace",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "discard" }],
      },
      {
        name: "The Lagoon",
        topActions: [{ a: "power", n: 1 }, { a: "fate" }],
        bottomActions: [{ a: "play" }, { a: "activate" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Eel", type: "ally", cost: 1, strength: 1,
        text: "Flotsam or Jetsam. Strength 1." }),
      ...copies(2, { name: "Crown", type: "item", subtype: "crown", cost: 3,
        text: "King Triton's Crown. Counts toward your objective.",
        place: true }),
      ...copies(2, { name: "Trident", type: "item", subtype: "trident", cost: 3,
        text: "King Triton's Trident. Counts toward your objective.",
        place: true }),
      ...copies(2, { name: "Glut the Shark", type: "ally", cost: 3, strength: 4,
        text: "A hungry shark. Strength 4." }),
      ...copies(2, { name: "Contract", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
      ...copies(2, { name: "Poor Souls", type: "effect", cost: 0,
        text: "Gain 2 Power.", auto: { power: 2 } }),
      ...copies(2, { name: "Ursula's Garden", type: "condition", cost: 0,
        text: "Bonus when a Hero is defeated (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Ariel", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(2, { name: "Prince Eric", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(1, { name: "King Triton", type: "hero", strength: 5,
        text: "Hero. Strength 5." }),
      ...copies(1, { name: "Sebastian", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
      ...copies(1, { name: "Flounder", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
    ],
  },

  jafar: {
    key: "jafar",
    name: "Jafar",
    title: "The Royal Vizier of Agrabah",
    color: "#9a3b1b",
    heart: "🧡",
    objectiveText:
      "Have the Magic Lamp at the Sultan's Palace and the Genie under your control at the start of your turn.",
    objective: (P) => {
      const palace = P.board.find((l) => l.name === "Sultan's Palace");
      const lampAtPalace = palace && palace.cards.some((c) => c.subtype === "lamp");
      const hasGenie = P.board.some((loc) =>
        loc.cards.some((c) => c.subtype === "genie")
      );
      return !!lampAtPalace && hasGenie;
    },
    locations: [
      {
        name: "Streets of Agrabah",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "fate" }, { a: "moveAllyItem" }],
      },
      {
        name: "The Jail",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "discard" }],
      },
      {
        name: "Cave of Wonders",
        topActions: [{ a: "play" }, { a: "power", n: 2 }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "vanquish" }],
      },
      {
        name: "Sultan's Palace",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "fate" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Palace Guards", type: "ally", cost: 1, strength: 1,
        text: "Loyal to the Vizier. Strength 1." }),
      ...copies(2, { name: "Iago", type: "ally", cost: 2, strength: 2,
        text: "Jafar's scheming parrot. Strength 2." }),
      ...copies(2, { name: "Magic Lamp", type: "item", subtype: "lamp", cost: 2,
        text: "The Magic Lamp. Move it to the Sultan's Palace for your objective.",
        place: true }),
      ...copies(1, { name: "Genie", type: "ally", subtype: "genie", cost: 4, strength: 5,
        text: "The Genie under your control. Strength 5. Counts toward your objective.",
        place: true }),
      ...copies(2, { name: "Gazeem the Thief", type: "ally", cost: 1, strength: 1,
        text: "Sent into the Cave of Wonders. Strength 1." }),
      ...copies(2, { name: "Hypnotize", type: "effect", cost: 1,
        text: "Gain control / draw 2 cards.", auto: { draw: 2 } }),
      ...copies(2, { name: "Snake Staff", type: "item", cost: 1,
        text: "Attach to an Ally: +1 Strength (resolve manually)." }),
      ...copies(2, { name: "Power of the Genie", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
    ],
    fateDeck: [
      ...copies(2, { name: "Aladdin", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(1, { name: "Princess Jasmine", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "The Sultan", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Abu", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
      ...copies(2, { name: "Magic Carpet", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
    ],
  },
};

const VILLAIN_ORDER = [
  "maleficent",
  "hook",
  "princejohn",
  "queenofhearts",
  "ursula",
  "jafar",
];
