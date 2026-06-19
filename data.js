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

// Count cards of a given subtype across a player's realm.
function countSubtype(P, sub) {
  return P.board.reduce(
    (n, l) => n + l.cards.filter((c) => c.subtype === sub).length,
    0
  );
}
// Count Deathly Hallows (subtype "hallow") across a player's realm.
function countHallows(P) {
  return countSubtype(P, "hallow");
}

const VILLAINS = {
  maleficent: {
    key: "maleficent",
    name: "Maleficent",
    title: "The Mistress of All Evil",
    color: "#2f9e4f",
    heart: "💚",
    icon: "🐉",
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
    color: "#c41e3a",
    heart: "❤️",
    icon: "🪝",
    objectiveText:
      "Defeat Peter Pan at the Jolly Roger.",
    // Win flag is set by the engine when Peter Pan is vanquished at the
    // Jolly Roger; checked here.
    objective: (P) => !!P.flags.defeatedPeterPan,
    locations: [
      {
        name: "Jolly Roger",
        topActions: [{ a: "play" }, { a: "moveHero" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
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
        locked: true, // unlocked by playing the Never Land Map
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
    ],
    deck: [
      ...copies(1, { name: "Never Land Map", type: "item", cost: 2,
        text: "Unlock Hangman's Tree.", unlock: "Hangman's Tree" }),
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
    color: "#e6c12f",
    heart: "💛",
    icon: "💰",
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
        name: "Nottingham",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "fate" }],
      },
      {
        name: "The Jail",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveHero" }],
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
    color: "#e34aa0",
    heart: "🩷",
    icon: "🃏",
    objectiveText:
      "Have a Wicket at every location, then take a turn without losing your temper (resolve the temper roll manually).",
    objective: (P) =>
      P.board.every((loc) => loc.cards.some((c) => c.subtype === "wicket")) &&
      !!P.flags.keptTemper,
    locations: [
      {
        name: "Courtyard",
        topActions: [{ a: "play" }, { a: "power", n: 1 }],
        bottomActions: [{ a: "fate" }, { a: "moveAllyItem" }],
      },
      {
        name: "Hedge Maze",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "discard" }],
      },
      {
        name: "Tulgey Wood",
        topActions: [{ a: "play" }, { a: "moveHero" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
      {
        name: "White Rabbit's House",
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
    color: "#8e44c9",
    heart: "💜",
    icon: "🐙",
    objectiveText:
      "Start your turn with King Triton's Trident and the Crown at Ursula's Lair.",
    objective: (P) => {
      const lair = P.board.find((l) => l.name === "Ursula's Lair");
      return (
        !!lair &&
        lair.cards.some((c) => c.subtype === "trident") &&
        lair.cards.some((c) => c.subtype === "crown")
      );
    },
    locations: [
      {
        name: "Ursula's Lair",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "fate" }],
      },
      {
        name: "Eric's Ship",
        topActions: [{ a: "play" }, { a: "moveHero" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
      {
        name: "The Shore",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "discard" }],
      },
      {
        name: "The Palace",
        locked: true, // lock token starts here; Change Form moves it
        topActions: [{ a: "power", n: 1 }, { a: "fate" }],
        bottomActions: [{ a: "play" }, { a: "activate" }],
      },
    ],
    deck: [
      ...copies(2, { name: "Change Form", type: "effect", cost: 1,
        text: "Move the Lock Token between Ursula's Lair and The Palace.",
        lockToggle: ["Ursula's Lair", "The Palace"] }),
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
    color: "#4b4a57",
    heart: "🖤",
    icon: "🪔",
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
        name: "Sultan's Palace",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "vanquish" }, { a: "fate" }],
      },
      {
        name: "Streets of Agrabah",
        topActions: [{ a: "power", n: 1 }, { a: "fate" }],
        bottomActions: [{ a: "discard" }, { a: "play" }],
      },
      {
        name: "Oasis",
        topActions: [{ a: "activate" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 3 }, { a: "play" }],
      },
      {
        name: "Cave of Wonders",
        locked: true, // unlocked by playing the Scarab Pendant
        topActions: [{ a: "play" }, { a: "power", n: 2 }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "vanquish" }],
      },
    ],
    deck: [
      ...copies(1, { name: "Scarab Pendant", type: "item", cost: 2,
        text: "Unlock the Cave of Wonders.", unlock: "Cave of Wonders" }),
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

  scar: {
    key: "scar",
    name: "Scar",
    title: "The Lion King's Brother",
    color: "#e07b2f",
    heart: "🧡",
    icon: "🦁",
    objectiveText:
      "Start your turn with at least 15 Strength in your Succession Pile (built from defeated Heroes).",
    objective: (P) => P.successionStrength >= 15,
    locations: [
      {
        name: "Pride Rock",
        topActions: [{ a: "play" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveAllyItem" }],
      },
      {
        name: "The Savanna",
        topActions: [{ a: "power", n: 1 }, { a: "fate" }],
        bottomActions: [{ a: "discard" }, { a: "play" }],
      },
      {
        name: "Elephant Graveyard",
        topActions: [{ a: "play" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 2 }, { a: "moveAllyItem" }],
      },
      {
        name: "The Gorge",
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "vanquish" }, { a: "power", n: 1 }],
      },
    ],
    deck: [
      ...copies(5, { name: "Hyenas", type: "ally", cost: 1, strength: 1,
        text: "The hyena horde. Strength 1 (deadly in numbers)." }),
      ...copies(2, { name: "Shenzi, Banzai & Ed", type: "ally", cost: 2, strength: 3,
        text: "Scar's lead hyenas. Strength 3." }),
      ...copies(2, { name: "Be Prepared", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
      ...copies(2, { name: "Whisper", type: "effect", cost: 1,
        text: "Move a Hero (lure Mufasa to The Gorge — resolve manually)." }),
      ...copies(2, { name: "Inheritance", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
      ...copies(2, { name: "Sleeper", type: "item", cost: 1,
        text: "Attach to an Ally: +2 Strength (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(1, { name: "Mufasa", type: "hero", strength: 7,
        text: "The true king. Strength 7." }),
      ...copies(2, { name: "Simba", type: "hero", strength: 5,
        text: "The rightful heir. Strength 5." }),
      ...copies(1, { name: "Nala", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(1, { name: "Rafiki", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Timon & Pumbaa", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Zazu", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
    ],
  },

  cruella: {
    key: "cruella",
    name: "Cruella De Vil",
    title: "The Fashionable Fiend",
    color: "#e8e8ef",
    heart: "🤍",
    icon: "🐕",
    objectiveText: "Start your turn with at least 99 captured Puppies.",
    objective: (P) => P.puppies >= 99,
    locations: [
      {
        name: "Radcliffe House",
        topActions: [{ a: "play" }, { a: "power", n: 1 }],
        bottomActions: [{ a: "fate" }, { a: "moveAllyItem" }],
      },
      {
        name: "Milk Farm",
        topActions: [{ a: "power", n: 2 }, { a: "activate" }],
        bottomActions: [{ a: "play" }, { a: "discard" }],
      },
      {
        name: "Countryside",
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
      {
        name: "Hell Hall",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveHero" }],
      },
    ],
    deck: [
      ...copies(3, { name: "Jasper & Horace", type: "ally", cost: 2, strength: 2,
        text: "The bumbling Baduns. Strength 2." }),
      ...copies(3, { name: "Round Up the Puppies", type: "effect", cost: 1,
        text: "Capture 11 Puppies.", auto: { puppies: 11 } }),
      ...copies(2, { name: "Steal the Strays", type: "effect", cost: 2,
        text: "Capture 22 Puppies.", auto: { puppies: 22 } }),
      ...copies(2, { name: "Cruella's Car", type: "item", cost: 1,
        text: "Speed across the realm (resolve manually)." }),
      ...copies(2, { name: "A Fortune", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
      ...copies(2, { name: "Pure Greed", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
    ],
    fateDeck: [
      ...copies(2, { name: "Pongo", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(2, { name: "Perdita", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(1, { name: "Sergeant Tibbs", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Roger & Anita", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Nanny", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
    ],
  },

  facilier: {
    key: "facilier",
    name: "Dr. Facilier",
    title: "The Shadow Man",
    color: "#6a3fb0",
    heart: "💜",
    icon: "🎩",
    objectiveText:
      "Have the Talisman in your realm and play Rule New Orleans to take over the city.",
    objective: (P) =>
      !!P.flags.ruleNewOrleans &&
      P.board.some((loc) => loc.cards.some((c) => c.subtype === "talisman")),
    locations: [
      {
        name: "Voodoo Emporium",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "fate" }],
      },
      {
        name: "The Parade",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "moveAllyItem" }, { a: "discard" }],
      },
      {
        name: "Tiana's Place",
        topActions: [{ a: "play" }, { a: "fate" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
      {
        name: "The Bayou",
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "activate" }, { a: "moveHero" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Shadow Demons", type: "ally", cost: 1, strength: 1,
        text: "Friends on the other side. Strength 1." }),
      ...copies(2, { name: "Lawrence", type: "ally", cost: 2, strength: 2,
        text: "Facilier's accomplice. Strength 2." }),
      ...copies(2, { name: "Talisman", type: "item", subtype: "talisman", cost: 2,
        text: "The Talisman. Required for your objective.", place: true }),
      ...copies(1, { name: "Rule New Orleans", type: "effect", cost: 3,
        text: "Take over the city! Completes your objective with the Talisman.",
        setFlag: "ruleNewOrleans" }),
      ...copies(2, { name: "The Cards Will Tell", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
      ...copies(2, { name: "Friends on the Other Side", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
      ...copies(2, { name: "Voodoo", type: "effect", cost: 1,
        text: "Dark magic (resolve manually)." }),
    ],
    fateDeck: [
      ...copies(2, { name: "Tiana", type: "hero", strength: 4,
        text: "Hero. Strength 4." }),
      ...copies(2, { name: "Prince Naveen", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(1, { name: "Mama Odie", type: "hero", strength: 3,
        text: "Hero. Strength 3." }),
      ...copies(1, { name: "Louis", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Ray", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
    ],
  },

  gaston: {
    key: "gaston",
    name: "Gaston",
    title: "The Hero of the Village",
    color: "#d6342c",
    heart: "❤️",
    icon: "💪",
    objectiveText:
      "Remove all 8 Obstacle tokens from your locations (use Activate to remove one).",
    objective: (P) => P.board.every((loc) => !loc.obstacles),
    locations: [
      {
        name: "Belle's House",
        obstacles: 2,
        topActions: [{ a: "activate" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "fate" }],
      },
      {
        name: "The Tavern",
        obstacles: 2,
        topActions: [{ a: "power", n: 2 }, { a: "activate" }],
        bottomActions: [{ a: "play" }, { a: "discard" }],
      },
      {
        name: "The Woods",
        obstacles: 2,
        topActions: [{ a: "activate" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "moveAllyItem" }],
      },
      {
        name: "Beast's Castle",
        obstacles: 2,
        topActions: [{ a: "activate" }, { a: "play" }],
        bottomActions: [{ a: "power", n: 1 }, { a: "vanquish" }],
      },
    ],
    deck: [
      ...copies(4, { name: "Villagers", type: "ally", cost: 1, strength: 1,
        text: "The angry mob. Strength 1." }),
      ...copies(3, { name: "LeFou", type: "ally", cost: 1, strength: 1,
        text: "Gaston's loyal sidekick. Strength 1." }),
      ...copies(2, { name: "Hunting Party", type: "ally", cost: 3, strength: 3,
        text: "Skilled hunters. Strength 3." }),
      ...copies(2, { name: "Bola", type: "item", cost: 1,
        text: "Attach to an Ally: +1 Strength (resolve manually)." }),
      ...copies(2, { name: "Tough Guy", type: "effect", cost: 0,
        text: "Gain 3 Power.", auto: { power: 3 } }),
      ...copies(2, { name: "Field Promotion", type: "effect", cost: 1,
        text: "Draw 2 cards.", auto: { draw: 2 } }),
    ],
    fateDeck: [
      ...copies(1, { name: "The Beast", type: "hero", strength: 6,
        text: "Hero. Strength 6." }),
      ...copies(2, { name: "Belle", type: "hero", strength: 4,
        text: "Hero. Strength 4. Blocks Obstacle removal while present (manual)." }),
      ...copies(1, { name: "Maurice", type: "hero", strength: 1,
        text: "Hero. Strength 1." }),
      ...copies(1, { name: "Lumiere", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
      ...copies(1, { name: "Cogsworth", type: "hero", strength: 2,
        text: "Hero. Strength 2." }),
    ],
  },

  darkstalker: {
    key: "darkstalker",
    name: "Darkstalker",
    title: "The NightWing Animus",
    color: "#6b5cc9",
    heart: "🖤",
    icon: "🐲",
    objectiveText:
      "Move the IceWing Army to the IceWing Palace, defeat Queen Glory to unlock the Rainforest, and defeat the IceWing Army to win.",
    // Win is sealed when the IceWing Army is vanquished (at the IceWing Palace).
    objective: (P) => !!P.flags.objectiveHeroDefeated,
    locations: [
      {
        name: "Jade Mountain Academy",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "The Rainforest Kingdom",
        locked: true, // unlocked when Queen Glory is defeated
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveAllyItem" }],
      },
      {
        name: "The Old Night Kingdom",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "The IceWing Palace",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "play" }],
      },
    ],
    deck: [
      // Allies (6)
      ...copies(1, { name: "Whiteout", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. While in the Realm, Items you play cost 1 less Power (resolve manually)." }),
      ...copies(1, { name: "Vulture", type: "ally", cost: 2, strength: 4,
        text: "Strength 4. When played, look at the top 3 cards of your deck and reorder them (resolve manually)." }),
      ...copies(1, { name: "Fierceteeth", type: "ally", cost: 1, strength: 3,
        text: "Strength 3. If played to the Old Night Kingdom, gain 1 Power (resolve manually)." }),
      ...copies(3, { name: "NightWing Loyalists", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. May be moved to adjacent locations for 1 Power less (resolve manually)." }),
      // Items (4)
      ...copies(1, { name: "The Obsidian Mirror", type: "item", cost: 1,
        text: "Move to any location. Activate: reveal top Fate card; discard or keep it (resolve manually)." }),
      ...copies(1, { name: "Darkstalker's Scroll", type: "item", cost: 3, grantsVanquish: true,
        text: "Attached Ally gains +2 Strength and Vanquish may be performed from this location." }),
      ...copies(2, { name: "Dreamvisitor", type: "item", cost: 1,
        text: "Activate: move one Hero to an adjacent location (resolve manually)." }),
      // Effects (6)
      ...copies(1, { name: "Charming Spell", type: "effect", cost: 3,
        text: "All Heroes in the Realm get -2 Strength until end of turn (resolve manually)." }),
      ...copies(1, { name: "Plague Spell", type: "effect", cost: 4, defeatHeroEffect: true,
        text: "Defeat one Hero in your Realm instantly (even in the locked Rainforest)." }),
      ...copies(1, { name: "Mind Reading", type: "effect", cost: 1,
        text: "Look at an opponent's hand; choose one card for them to discard (resolve manually)." }),
      ...copies(1, { name: "Animate Statue", type: "effect", cost: 2,
        text: "Move any Ally or Item to any location in your Realm (resolve manually)." }),
      ...copies(2, { name: "Future Sight", type: "effect", cost: 0,
        text: "Draw 2 cards, then discard 1 from your hand (draw is automatic; discard manually).",
        auto: { draw: 2 } }),
      // Conditions (4)
      ...copies(1, { name: "Enthrall", type: "condition", cost: 0,
        text: "Play on an opponent's turn if they defeat one of your Allies: take the Hero that defeated it as an Ally with Strength 3 (resolve manually)." }),
      ...copies(3, { name: "Arrogance", type: "condition", cost: 0,
        text: "Play if an opponent Fates you: gain 2 Power immediately.", auto: { power: 2 } }),
    ],
    fateDeck: [
      // Heroes (8)
      ...copies(1, { name: "Queen Glory", type: "hero", strength: 5,
        placeAt: "The Rainforest Kingdom",
        unlocksOnDefeat: "The Rainforest Kingdom",
        trophyOnDefeat: { name: "Crown of the NightWings", subtype: "crown",
          text: "Claimed by defeating Queen Glory — symbol of Darkstalker's rule." },
        text: "Strength 5. Placed at the Rainforest Kingdom, keeping it locked. Defeat her to unlock it and claim the Crown of the NightWings." }),
      ...copies(1, { name: "Prince Winter", type: "hero", strength: 4,
        text: "Strength 4. When played, return an IceWing Hero from the Fate discard to the Realm (manual)." }),
      ...copies(1, { name: "Moonwatcher", type: "hero", strength: 3,
        text: "Strength 3. While in the Realm, Darkstalker pays +1 Power for Effects (manual)." }),
      ...copies(1, { name: "Qibli", type: "hero", strength: 3,
        text: "Strength 3. When played, move an Item from the Realm to the Fate discard (manual)." }),
      ...copies(1, { name: "Kinkajou", type: "hero", strength: 2,
        text: "Strength 2. If played to Darkstalker's location, he discards 2 random cards (manual)." }),
      ...copies(1, { name: "Peril", type: "hero", strength: 5,
        text: "Strength 5. When played, defeat one Villain Ally at her location (manual)." }),
      ...copies(1, { name: "Turtle", type: "hero", strength: 4,
        text: "Strength 4. Darkstalker can't use Darkstalker's Scroll while Turtle shares its location (manual)." }),
      ...copies(1, { name: "IceWing Army", type: "hero", strength: 6, winOnDefeat: true,
        placeAt: "The IceWing Palace",
        text: "Strength 6. Placed at the IceWing Palace. Defeat it there to win." }),
      // Effects & Conditions (4)
      ...copies(2, { name: "Strawberry Trickery", type: "fateEffect",
        text: "Move Darkstalker to Jade Mountain Academy; he loses all Power (resolve manually)." }),
      ...copies(2, { name: "The Lost Continent", type: "fateEffect",
        text: "Discard all Allies at the IceWing Palace (resolve manually)." }),
    ],
  },

  snow: {
    key: "snow",
    name: "President Snow",
    title: "The Tyrant of Panem",
    color: "#9b1c31",
    heart: "🤍",
    icon: "🌹",
    objectiveText:
      "Defeat Katniss Everdeen (unlocking District 13) AND defeat the Rebel Army at The Capitol to win.",
    objective: (P) => !!P.flags.objectiveHeroDefeated && !!P.flags.katnissDefeated,
    locations: [
      {
        name: "The Capitol",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "District 13",
        locked: true, // unlocked when Katniss Everdeen is defeated
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveAllyItem" }],
      },
      {
        name: "The Hunger Games Arena",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "District 12",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "play" }],
      },
    ],
    deck: [
      // Allies (6)
      ...copies(1, { name: "Tigris", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. While in the Realm, Items you play cost 1 less Power (resolve manually)." }),
      ...copies(1, { name: "Plutarch Heavensbee", type: "ally", cost: 2, strength: 4,
        text: "Strength 4. When played, look at the top 3 cards of your deck and reorder them (resolve manually)." }),
      ...copies(1, { name: "Head Peacekeeper Thread", type: "ally", cost: 1, strength: 3,
        text: "Strength 3. If played to District 12, gain 1 Power (resolve manually)." }),
      ...copies(3, { name: "Capitol Peacekeepers", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. May be moved to adjacent locations for 1 Power less (resolve manually)." }),
      // Items (4)
      ...copies(1, { name: "The Poisoned Wine", type: "item", cost: 1,
        text: "Move to any location. Activate: reveal top Fate card; discard or keep it (resolve manually)." }),
      ...copies(1, { name: "Snow's Rose", type: "item", cost: 3, grantsVanquish: true,
        text: "Attached Ally gains +2 Strength and Vanquish may be performed from this location." }),
      ...copies(2, { name: "Television Broadcast", type: "item", cost: 1,
        text: "Activate: move one Hero to an adjacent location (resolve manually)." }),
      // Effects (6)
      ...copies(1, { name: "Charming Smile", type: "effect", cost: 3,
        text: "All Heroes in the Realm get -2 Strength until end of turn (resolve manually)." }),
      ...copies(1, { name: "White Rose Calling Card", type: "effect", cost: 4, defeatHeroEffect: true,
        text: "Defeat one District Hero in your Realm instantly (even in locked District 13)." }),
      ...copies(1, { name: "Avox Interrogation", type: "effect", cost: 1,
        text: "Look at an opponent's hand; choose one card for them to discard (resolve manually)." }),
      ...copies(1, { name: "Mutts Release", type: "effect", cost: 2,
        text: "Move any Ally or Item to any location in your Realm (resolve manually)." }),
      ...copies(2, { name: "Avid Tracker", type: "effect", cost: 0,
        text: "Draw 2 cards, then discard 1 from your hand (draw is automatic; discard manually).",
        auto: { draw: 2 } }),
      // Conditions (4)
      ...copies(1, { name: "Tracker Jacker Venom", type: "condition", cost: 0,
        text: "Play on an opponent's turn if they defeat one of your Allies: take the Hero that defeated it as an Ally with Strength 3 (resolve manually)." }),
      ...copies(3, { name: "Ruthless Ambition", type: "condition", cost: 0,
        text: "Play if an opponent Fates you: gain 2 Power immediately.", auto: { power: 2 } }),
    ],
    fateDeck: [
      // Heroes (8)
      ...copies(1, { name: "Katniss Everdeen", type: "hero", strength: 5,
        placeAt: "District 13",
        unlocksOnDefeat: "District 13",
        defeatFlag: "katnissDefeated",
        text: "Strength 5. Placed at District 13, keeping it locked. Defeat her (e.g. White Rose Calling Card) to unlock it — required to win." }),
      ...copies(1, { name: "Gale Hawthorne", type: "hero", strength: 4,
        text: "Strength 4. When played, return a District Hero from the Fate discard to the Realm (manual)." }),
      ...copies(1, { name: "Peeta Mellark", type: "hero", strength: 3,
        text: "Strength 3. While in the Realm, Snow pays +1 Power for Effects (manual)." }),
      ...copies(1, { name: "Haymitch Abernathy", type: "hero", strength: 3,
        text: "Strength 3. When played, move an Item from the Realm to the Fate discard (manual)." }),
      ...copies(1, { name: "Finnick Odair", type: "hero", strength: 2,
        text: "Strength 2. If played to Snow's location, he discards 2 random cards (manual)." }),
      ...copies(1, { name: "Johanna Mason", type: "hero", strength: 5,
        text: "Strength 5. When played, defeat one Villain Ally at her location (manual)." }),
      ...copies(1, { name: "Beetee Latier", type: "hero", strength: 4,
        text: "Strength 4. Snow can't use Snow's Rose while Beetee shares its location (manual)." }),
      ...copies(1, { name: "Rebel Army", type: "hero", strength: 6, winOnDefeat: true,
        placeAt: "The Capitol",
        text: "Strength 6. Placed at The Capitol. Defeat it there to win (use Snow's Rose to Vanquish at The Capitol)." }),
      // Effects & Conditions (4)
      ...copies(2, { name: "Nightlock Berries", type: "fateEffect",
        text: "Move Snow to The Capitol; he loses all Power (resolve manually)." }),
      ...copies(2, { name: "The Mockingjay Symbol", type: "fateEffect",
        text: "Discard all Allies at The Capitol (resolve manually)." }),
    ],
  },

  voldemort: {
    key: "voldemort",
    name: "Lord Voldemort",
    title: "The Dark Lord",
    color: "#9a9aa8",
    heart: "🩶",
    icon: "🐍",
    objectiveText:
      "Gather and protect all three Deathly Hallows in your Realm, then defeat Harry Potter at Hogwarts Castle.",
    objective: (P) => countHallows(P) >= 3 && !!P.flags.harryDefeated,
    locations: [
      {
        name: "The Ministry of Magic",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "Hogwarts Castle",
        locked: true, // unlocks once 2+ Deathly Hallows are in the Realm
        unlockCondition: (P) => countHallows(P) >= 2,
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveAllyItem" }],
      },
      {
        name: "The Graveyard",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "Malfoy Manor",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "play" }],
      },
    ],
    deck: [
      // Allies (6)
      ...copies(1, { name: "Narcissa Malfoy", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. While in the Realm, Items you play cost 1 less Power (resolve manually)." }),
      ...copies(1, { name: "Lucius Malfoy", type: "ally", cost: 2, strength: 4,
        text: "Strength 4. When played, look at the top 3 cards of your deck and reorder them (resolve manually)." }),
      ...copies(1, { name: "Peter Pettigrew", type: "ally", cost: 1, strength: 3,
        text: "Strength 3. If played to The Graveyard, gain 1 Power (resolve manually)." }),
      ...copies(3, { name: "Death Eaters", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. May be moved to adjacent locations for 1 Power less (resolve manually)." }),
      // Items (4) — three are Deathly Hallows
      ...copies(1, { name: "The Elder Wand", type: "item", subtype: "hallow", cost: 3,
        text: "Deathly Hallow. Attached Ally gains +2 Strength. Required to win (resolve bonus manually).",
        place: true }),
      ...copies(1, { name: "The Resurrection Stone", type: "item", subtype: "hallow", cost: 2,
        text: "Deathly Hallow. Activate: return an Ally from your discard to your hand (resolve manually).",
        place: true }),
      ...copies(1, { name: "The Cloak of Invisibility", type: "item", subtype: "hallow", cost: 2,
        text: "Deathly Hallow. The attached Ally can't be targeted or discarded by Heroes (resolve manually).",
        place: true }),
      ...copies(1, { name: "Vanishing Cabinet", type: "item", cost: 1,
        text: "Activate: move one Hero to an adjacent location (resolve manually)." }),
      // Effects (6)
      ...copies(1, { name: "Charming Facade", type: "effect", cost: 3,
        text: "All Heroes in the Realm get -2 Strength until end of turn (resolve manually)." }),
      ...copies(1, { name: "Morsmordre", type: "effect", cost: 4, defeatHeroEffect: true, defeatHeroMaxStrength: 4,
        text: "Defeat one Hero with Strength 4 or less in your Realm instantly." }),
      ...copies(1, { name: "Legilimens", type: "effect", cost: 1,
        text: "Look at an opponent's hand; choose one card for them to discard (resolve manually)." }),
      ...copies(1, { name: "Taboo Curse", type: "effect", cost: 2,
        text: "Move any Ally or Item to any location in your Realm (resolve manually)." }),
      ...copies(2, { name: "Dark Prophecy", type: "effect", cost: 0,
        text: "Draw 2 cards, then discard 1 from your hand (draw is automatic; discard manually).",
        auto: { draw: 2 } }),
      // Conditions (4)
      ...copies(1, { name: "Imperius Curse", type: "condition", cost: 0,
        text: "Play on an opponent's turn if they defeat one of your Allies: take the Hero that defeated it as an Ally with Strength 3 (resolve manually)." }),
      ...copies(3, { name: "Pureblood Pride", type: "condition", cost: 0,
        text: "Play if an opponent Fates you: gain 2 Power immediately.", auto: { power: 2 } }),
    ],
    fateDeck: [
      // Heroes (8)
      ...copies(1, { name: "Harry Potter", type: "hero", strength: 6,
        placeAt: "Hogwarts Castle",
        defeatFlag: "harryDefeated",
        text: "Strength 6. Placed at Hogwarts Castle. Vanquish him there (with all 3 Hallows) to win." }),
      ...copies(1, { name: "Albus Dumbledore", type: "hero", strength: 5,
        text: "Strength 5. While in the Realm, Voldemort can't play or move Deathly Hallows (manual)." }),
      ...copies(1, { name: "Sirius Black", type: "hero", strength: 4,
        text: "Strength 4. When played, return a Hero from the Fate discard to the Realm (manual)." }),
      ...copies(1, { name: "Hermione Granger", type: "hero", strength: 3,
        text: "Strength 3. While in the Realm, Voldemort pays +1 Power for Effects (manual)." }),
      ...copies(1, { name: "Ron Weasley", type: "hero", strength: 3,
        text: "Strength 3. When played, move an Item from the Realm to the Fate discard (manual)." }),
      ...copies(1, { name: "Neville Longbottom", type: "hero", strength: 2,
        text: "Strength 2. If played to Voldemort's location, he discards 2 random cards (manual)." }),
      ...copies(1, { name: "Severus Snape", type: "hero", strength: 4,
        text: "Strength 4. Voldemort can't use The Elder Wand while Snape shares its location (manual)." }),
      ...copies(1, { name: "Order of the Phoenix", type: "hero", strength: 5,
        text: "Strength 5. When played, return a Deathly Hallow from the Realm to Voldemort's hand (manual)." }),
      // Effects & Conditions (4)
      ...copies(2, { name: "Expelliarmus", type: "fateEffect",
        text: "Move Voldemort to The Ministry of Magic; he loses all Power (resolve manually)." }),
      ...copies(2, { name: "Lily's Sacrifice", type: "fateEffect",
        text: "Choose a Deathly Hallow in Voldemort's Realm and discard it (resolve manually)." }),
    ],
  },

  drago: {
    key: "drago",
    name: "Drago Bludvist",
    title: "The Dragon Conqueror",
    color: "#4f93b0",
    heart: "🩵",
    icon: "❄️",
    objectiveText:
      "Control the Bewilderbeast at the Dragon Sanctuary and defeat Hiccup & Toothless there to win.",
    objective: (P) => {
      const s = P.board.find((l) => l.name === "The Dragon Sanctuary");
      return (
        !!s &&
        s.cards.some((c) => c.subtype === "bewilderbeast") &&
        !!P.flags.hiccupDefeated
      );
    },
    locations: [
      {
        name: "Drago's War Fleet",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "The Dragon Sanctuary",
        locked: true, // unlocks once 2+ Dragon Trappers are in the Realm
        unlockCondition: (P) => countSubtype(P, "trapper") >= 2,
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveAllyItem" }],
      },
      {
        name: "The Island of Berk",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "The Trapper Outpost",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "play" }],
      },
    ],
    deck: [
      // Allies (6)
      ...copies(1, { name: "Eret, Son of Eret", type: "ally", cost: 2, strength: 4,
        text: "Strength 4. When played, look at the top 3 cards of your deck and reorder them (resolve manually)." }),
      ...copies(1, { name: "Drago's Enforcer", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. While in the Realm, Items you play cost 1 less Power (resolve manually)." }),
      ...copies(1, { name: "Armored Dragon", type: "ally", cost: 1, strength: 3,
        text: "Strength 3. If played to The Trapper Outpost, gain 1 Power (resolve manually)." }),
      ...copies(3, { name: "Dragon Trappers", type: "ally", subtype: "trapper", cost: 2, strength: 3,
        text: "Strength 3. 2+ in your Realm unlock the Dragon Sanctuary. Move to adjacent locations for 1 less Power (manual)." }),
      // Items (4)
      ...copies(1, { name: "The Bewilderbeast", type: "item", subtype: "bewilderbeast", cost: 3,
        text: "Alpha Dragon. Attached Ally gains +2 Strength. Must be at the Dragon Sanctuary to win.",
        place: true }),
      ...copies(1, { name: "Dragon-Proof Chains", type: "item", cost: 2,
        text: "Activate: return an Ally from your discard to your hand (resolve manually)." }),
      ...copies(1, { name: "Drago's Bullwhip", type: "item", cost: 2,
        text: "The attached Ally can't be targeted or discarded by Heroes (resolve manually)." }),
      ...copies(1, { name: "Trapper Net", type: "item", cost: 1,
        text: "Activate: move one Hero to an adjacent location (resolve manually)." }),
      // Effects (6)
      ...copies(1, { name: "Charming Tyranny", type: "effect", cost: 3,
        text: "All Heroes in the Realm get -2 Strength until end of turn (resolve manually)." }),
      ...copies(1, { name: "Dragon Call", type: "effect", cost: 4, defeatHeroEffect: true, defeatHeroMaxStrength: 4,
        text: "Defeat one Hero with Strength 4 or less in your Realm instantly." }),
      ...copies(1, { name: "Intimidation", type: "effect", cost: 1,
        text: "Look at an opponent's hand; choose one card for them to discard (resolve manually)." }),
      ...copies(1, { name: "Enforced Order", type: "effect", cost: 2,
        text: "Move any Ally or Item to any location in your Realm (resolve manually)." }),
      ...copies(2, { name: "Battle Strategy", type: "effect", cost: 0,
        text: "Draw 2 cards, then discard 1 from your hand (draw is automatic; discard manually).",
        auto: { draw: 2 } }),
      // Conditions (4)
      ...copies(1, { name: "Dragon Command", type: "condition", cost: 0,
        text: "Play on an opponent's turn if they defeat one of your Allies: take the Hero that defeated it as an Ally with Strength 3 (resolve manually)." }),
      ...copies(3, { name: "Unyielding Will", type: "condition", cost: 0,
        text: "Play if an opponent Fates you: gain 2 Power immediately.", auto: { power: 2 } }),
    ],
    fateDeck: [
      // Heroes (8)
      ...copies(1, { name: "Hiccup & Toothless", type: "hero", strength: 6,
        placeAt: "The Dragon Sanctuary",
        defeatFlag: "hiccupDefeated",
        text: "Strength 6. Placed at the Dragon Sanctuary. Vanquish them there to win." }),
      ...copies(1, { name: "Valka", type: "hero", strength: 5,
        text: "Strength 5. While in the Realm, Drago can't play or move the Bewilderbeast (manual)." }),
      ...copies(1, { name: "Stoick the Vast", type: "hero", strength: 4,
        text: "Strength 4. When played, return a Hero from the Fate discard to the Realm (manual)." }),
      ...copies(1, { name: "Astrid & Stormfly", type: "hero", strength: 3,
        text: "Strength 3. While in the Realm, Drago pays +1 Power for Effects (manual)." }),
      ...copies(1, { name: "Gobber", type: "hero", strength: 3,
        text: "Strength 3. When played, move an Item from the Realm to the Fate discard (manual)." }),
      ...copies(1, { name: "Ruffnut & Tuffnut", type: "hero", strength: 2,
        text: "Strength 2. If played to Drago's location, he discards 2 random cards (manual)." }),
      ...copies(1, { name: "Fishlegs & Meatlug", type: "hero", strength: 4,
        text: "Strength 4. Drago can't use the Bewilderbeast while Fishlegs shares its location (manual)." }),
      ...copies(1, { name: "Snotlout & Hookfang", type: "hero", strength: 5,
        text: "Strength 5. When played, return an Item from the Realm to Drago's hand (manual)." }),
      // Effects & Conditions (4)
      ...copies(2, { name: "Dragon Rebellion", type: "fateEffect",
        text: "Move Drago to Drago's War Fleet; he loses all Power (resolve manually)." }),
      ...copies(2, { name: "The Alpha's Protection", type: "fateEffect",
        text: "Choose an Item in Drago's Realm and discard it (resolve manually)." }),
    ],
  },

  burr: {
    key: "burr",
    name: "Aaron Burr",
    title: "The Man Who Shot Hamilton",
    color: "#5566a0",
    heart: "💙",
    icon: "🗳️",
    objectiveText:
      "Build your Political Influence to 10, then defeat Alexander Hamilton in a duel at Weehawken.",
    objective: (P) => P.politicalInfluence >= 10 && !!P.flags.hamiltonDefeated,
    locations: [
      {
        name: "New York City",
        topActions: [{ a: "power", n: 2 }, { a: "play" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "The Senate Floor",
        locked: true, // unlocks once Burr has 5+ Political Influence
        unlockCondition: (P) => P.politicalInfluence >= 5,
        topActions: [{ a: "power", n: 1 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "moveAllyItem" }],
      },
      {
        name: "Albany",
        topActions: [{ a: "play" }, { a: "activate" }],
        bottomActions: [{ a: "discard" }, { a: "fate" }],
      },
      {
        name: "Weehawken",
        topActions: [{ a: "power", n: 3 }, { a: "play" }],
        bottomActions: [{ a: "vanquish" }, { a: "play" }],
      },
    ],
    deck: [
      // Allies (6)
      ...copies(1, { name: "Theodosia Bartow Burr", type: "ally", cost: 2, strength: 4,
        text: "Strength 4. When played, look at the top 3 cards of your deck and reorder them (resolve manually)." }),
      ...copies(1, { name: "Burr's Campaign Manager", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. While in the Realm, Items you play cost 1 less Power (resolve manually)." }),
      ...copies(1, { name: "Democratic-Republican Ally", type: "ally", cost: 1, strength: 3,
        text: "Strength 3. If played to Albany, gain 1 Power (resolve manually)." }),
      ...copies(3, { name: "Tammany Soldiers", type: "ally", cost: 2, strength: 3,
        text: "Strength 3. May be moved to adjacent locations for 1 Power less (resolve manually)." }),
      // Items (4)
      ...copies(1, { name: "Political Influence", type: "item", subtype: "influence", cost: 3,
        text: "Tracker. Use Activate (at Albany) to pay 2 Power for 1 Influence token. Reach 10 to win.",
        place: true }),
      ...copies(1, { name: "The Dueling Pistols", type: "item", cost: 2,
        text: "Attached Ally gains +2 Strength (resolve bonus manually)." }),
      ...copies(1, { name: "Private Journals", type: "item", cost: 2,
        text: "The attached Ally can't be targeted or discarded by Heroes (resolve manually)." }),
      ...copies(1, { name: "Campaign Pamphlet", type: "item", cost: 1,
        text: "Activate: move one Hero to an adjacent location (resolve manually)." }),
      // Effects (6)
      ...copies(1, { name: "Talk Less, Smile More", type: "effect", cost: 3,
        text: "All Heroes in the Realm get -2 Strength until end of turn (resolve manually)." }),
      ...copies(1, { name: "Political Maneuver", type: "effect", cost: 4, defeatHeroEffect: true, defeatHeroMaxStrength: 4,
        text: "Defeat one Hero with Strength 4 or less in your Realm instantly." }),
      ...copies(1, { name: "Secret Correspondence", type: "effect", cost: 1,
        text: "Look at an opponent's hand; choose one card for them to discard (resolve manually)." }),
      ...copies(1, { name: "Wait For It", type: "effect", cost: 2,
        text: "Move any Ally or Item to any location in your Realm (resolve manually)." }),
      ...copies(2, { name: "An Open Letter", type: "effect", cost: 0,
        text: "Draw 2 cards, then discard 1 from your hand (draw is automatic; discard manually).",
        auto: { draw: 2 } }),
      // Conditions (4)
      ...copies(1, { name: "Opportunist", type: "condition", cost: 0,
        text: "Play on an opponent's turn if they defeat one of your Allies: take the Hero that defeated it as an Ally with Strength 3 (resolve manually)." }),
      ...copies(3, { name: "Calculated Patience", type: "condition", cost: 0,
        text: "Play if an opponent Fates you: gain 2 Power immediately.", auto: { power: 2 } }),
    ],
    fateDeck: [
      // Heroes (8)
      ...copies(1, { name: "Alexander Hamilton", type: "hero", strength: 6,
        placeAt: "Weehawken",
        defeatFlag: "hamiltonDefeated",
        text: "Strength 6. Placed at Weehawken. Vanquish him there (the duel) to win." }),
      ...copies(1, { name: "George Washington", type: "hero", strength: 5, blocksInfluence: true,
        text: "Strength 5. While in the Realm, Burr can't add Political Influence tokens." }),
      ...copies(1, { name: "Thomas Jefferson", type: "hero", strength: 4,
        text: "Strength 4. When played, return a Hero from the Fate discard to the Realm (manual)." }),
      ...copies(1, { name: "Angelica Schuyler", type: "hero", strength: 3,
        text: "Strength 3. While in the Realm, Burr pays +1 Power for Effects (manual)." }),
      ...copies(1, { name: "John Laurens", type: "hero", strength: 3,
        text: "Strength 3. When played, move an Item from the Realm to the Fate discard (manual)." }),
      ...copies(1, { name: "Marquis de Lafayette", type: "hero", strength: 2,
        text: "Strength 2. If played to Burr's location, he discards 2 random cards (manual)." }),
      ...copies(1, { name: "James Madison", type: "hero", strength: 4,
        text: "Strength 4. Burr can't use The Dueling Pistols while Madison shares its location (manual)." }),
      ...copies(1, { name: "Elizabeth Schuyler", type: "hero", strength: 5,
        text: "Strength 5. When played, remove 2 Political Influence tokens (resolve manually)." }),
      // Effects & Conditions (4)
      ...copies(2, { name: "The Reynolds Pamphlet", type: "fateEffect",
        text: "Move Burr to New York City; he loses all Power (resolve manually)." }),
      ...copies(2, { name: "Political Isolation", type: "fateEffect",
        text: "Choose an Item in Burr's Realm and discard it (resolve manually)." }),
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
  "scar",
  "cruella",
  "facilier",
  "gaston",
  "darkstalker",
  "snow",
  "voldemort",
  "drago",
  "burr",
];

// Difficulty rating per villain (1 = easiest, 5 = hardest) — how tricky
// their objective is to complete. Used by the "Even Match" balancer.
const VILLAIN_DIFFICULTY = {
  princejohn: 1,
  maleficent: 2,
  cruella: 2,
  gaston: 2,
  hook: 3,
  queenofhearts: 3,
  scar: 3,
  ursula: 4,
  jafar: 4,
  facilier: 4,
  darkstalker: 4,
  snow: 5,
  voldemort: 5,
  drago: 5,
  burr: 5,
};
function villainDifficulty(key) {
  return VILLAIN_DIFFICULTY[key] || 3;
}
function difficultyStars(key) {
  const d = villainDifficulty(key);
  return "★".repeat(d) + "☆".repeat(5 - d);
}

// Step-by-step strategy for completing each villain's objective.
const VILLAIN_GUIDES = {
  maleficent: [
    "Play <b>Curse</b> cards (⚡2) — each one places a Curse at one of your locations.",
    "Spread Curses until there is <b>one at all four</b> locations.",
    "Defend them, then <b>start a turn</b> with a Curse everywhere to win.",
  ],
  hook: [
    "Recruit Pirates and allies to build up <b>Strength</b>.",
    "Peter Pan arrives via Fate — use <b>Move a Hero</b> to bring him to the <b>Jolly Roger</b>.",
    "At the Jolly Roger, <b>Vanquish Peter Pan</b> (allies' Strength ≥ 7) to win.",
  ],
  princejohn: [
    "Use <b>Gain Power</b> actions and Taxes/Greed effects to bank Power.",
    "Avoid overspending; watch for opponents draining you.",
    "<b>Start a turn with 20+ Power</b> to win.",
  ],
  queenofhearts: [
    "Play a <b>Wicket</b> at each of your four locations.",
    "Resolve the <b>“Off with their heads!”</b> temper step.",
    "Start a turn with a Wicket <b>everywhere</b> to win.",
  ],
  ursula: [
    "Find and play the <b>Crown</b> and <b>Trident</b> items.",
    "Use <b>Move Ally/Item</b> to gather both at <b>Ursula's Lair</b>.",
    "Use <b>Change Form</b> to keep the lock token off the Lair, then start a turn with both there.",
  ],
  jafar: [
    "Play the <b>Scarab Pendant</b> to unlock the Cave of Wonders.",
    "Find the <b>Magic Lamp</b> and move it to the <b>Sultan's Palace</b>.",
    "Get the <b>Genie</b> into your realm, then start a turn with both to win.",
  ],
  scar: [
    "Gather <b>Hyenas</b> to build Strength.",
    "Lure <b>Mufasa</b> to <b>The Gorge</b> and Vanquish him — his Strength joins your Succession Pile.",
    "Defeat more Heroes until the pile reaches <b>15+ Strength</b>.",
  ],
  cruella: [
    "Play capture effects: <b>Round Up the Puppies</b> (+11) and <b>Steal the Strays</b> (+22).",
    "Keep capturing while defending your realm.",
    "Reach <b>99+ Puppies</b> at the start of a turn to win.",
  ],
  facilier: [
    "Find and play the <b>Talisman</b> — keep it in your realm.",
    "Bank ⚡3 and play <b>Rule New Orleans</b>.",
    "With the Talisman down and Rule New Orleans played, you win.",
  ],
  gaston: [
    "Each location starts with <b>2 Obstacle tokens</b> (8 total).",
    "Move to a location and use <b>Activate</b> to clear one Obstacle.",
    "Clear <b>all 8</b> to win. (Defeat Belle first — she blocks removal.)",
  ],
  darkstalker: [
    "Pull <b>Queen Glory</b> out of the locked Rainforest (Dreamvisitor) or use <b>Plague Spell</b>, then defeat her — this unlocks the Rainforest and grants the <b>Crown</b>.",
    "The <b>IceWing Army</b> is fated to the IceWing Palace.",
    "Move there and <b>Vanquish the IceWing Army</b> (Strength ≥ 6) to win.",
  ],
  snow: [
    "Pre-place <b>Snow's Rose</b> at <b>The Capitol</b> — it grants a Vanquish there.",
    "Use <b>White Rose Calling Card</b> to instantly defeat <b>Katniss</b> in locked District 13 (unlocks it).",
    "Vanquish the <b>Rebel Army</b> at The Capitol. <b>Both</b> done = win.",
  ],
  voldemort: [
    "Play the three <b>Deathly Hallows</b> (Elder Wand, Resurrection Stone, Cloak) into your realm.",
    "With 2 Hallows down, <b>Hogwarts unlocks</b>; get the 3rd too.",
    "Build allies to Strength ≥ 6 and <b>Vanquish Harry Potter</b> at Hogwarts to win.",
  ],
  drago: [
    "Recruit at least <b>2 Dragon Trappers</b> to unlock the <b>Dragon Sanctuary</b>.",
    "Play the <b>Bewilderbeast</b> and move it to the <b>Dragon Sanctuary</b> (keep it there).",
    "Build allies to Strength ≥ 6 and <b>Vanquish Hiccup & Toothless</b> at the Sanctuary to win.",
  ],
  burr: [
    "Play the <b>Political Influence</b> tracker item into your realm.",
    "At <b>Albany</b>, use <b>Activate</b> (pay 2 Power) to add Influence tokens — 5 unlocks the Senate Floor.",
    "Reach <b>10 Influence</b>, then <b>Vanquish Alexander Hamilton</b> at Weehawken to win.",
  ],
};
function villainGuide(key) {
  return VILLAIN_GUIDES[key] || [];
}
