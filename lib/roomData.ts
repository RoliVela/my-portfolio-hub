// lib/roomData.ts - Version: 2026-07-10 14:10:00 UTC
// Snippy dialogue text is sourced from the user-authored "Roli Room
// Interaction Table". Note: OBJ_02..OBJ_09 below are still placeholder
// guesses from before that table existed and don't match its real IDs
// (real OBJ_02 = "Snippy (Scissors)") — renumbering them to match the
// full 20-object table is a separate future pass, so the Snippy check-in
// object below is given a collision-free id instead of reusing "OBJ_02".

export interface DialogueEntry {
  speaker: 'Snippy' | 'User';
  text: string;
}

export interface RoomObject {
  id: string;
  assetName: string;
  type: string;
  initialState: Record<string, any>; // Flexible for various states
  dialogue: {
    free: DialogueEntry[];
    // Alternate free-tier dialogue shown once every other room object has
    // been interacted with (used by Snippy's check-in / thank-you line).
    freeComplete?: DialogueEntry[];
    paid: string; // LLM context prompt
  };
  actionTarget: string;
  visualFeedback: string;
  isInitialDialogue?: boolean; // Optional flag for initial dialogue
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const roomObjects: RoomObject[] = [
  {
    id: 'OBJ_01',
    assetName: 'Snippy (Character)',
    type: 'Conversation / Click',
    initialState: {
      isInteracted: false,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Wow, Roli's room sure is cool! I wonder if it's this tidy in real life.` },
        { speaker: 'Snippy', text: `You can look around or do a one time payment to use Roli's paid websites, though I've heard there's a way around that.` },
      ],
      paid: `Upon paying, the pay button will become a talk button on the UI. From here, the user can ask Snippy anything, and the LLM will provide a response.`,
    },
    actionTarget: 'Triggers main chat terminal overlay',
    visualFeedback: 'Launches with text dialogue upon the website loading up.',
    isInitialDialogue: true,
    position: {
      x: 46.53,
      y: 81.93,
      width: 10,
      height: 12,
    },
  },
  {
    id: 'OBJ_02_SNIPPY_SCISSORS',
    assetName: 'Snippy (Scissors)',
    type: 'Click / Inspect',
    initialState: {
      isInteracted: false,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Are you having fun? There's still some stuff you haven't looked at yet. Keep looking around.` },
      ],
      freeComplete: [
        { speaker: 'Snippy', text: `Wow, you went through the whole website! Hey this is Roli and I just wanna say I really appreciate you bro, thanks for using the website (:` },
      ],
      paid: '',
    },
    actionTarget: 'Local dialog bubble',
    visualFeedback: 'Yellow highlight on hover',
    // Same on-screen sprite as OBJ_01 — reuses its position, this is just
    // the "click after the intro" behavior for that same character.
    position: {
      x: 46.53,
      y: 81.93,
      width: 10,
      height: 12,
    },
  },
  {
    id: 'OBJ_02',
    assetName: 'Desk',
    type: 'Decorative / Clickable',
    initialState: {
      hasItems: true,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `This is Roli's desk! Where all the coding magic happens!` },
        { speaker: 'User', text: `Any cool items on it?` },
        { speaker: 'Snippy', text: `Maybe a few… you'll have to explore!` },
      ],
      paid: `Snippy will highlight items on the desk, suggest interactions, or provide context about Roli's current projects related to the desk setup.`,
    },
    actionTarget: 'Click to inspect items, open sub-dialogue',
    visualFeedback: 'Subtle glow on hover',
    position: {
      x: 30,
      y: 60,
      width: 40,
      height: 35,
    },
  },
  {
    id: 'OBJ_03',
    assetName: 'Computer (with terminal)',
    type: 'Gated / Interactive',
    initialState: {
      isLocked: true,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Ooh, the computer! That's where Roli's professional journey really shines!` },
        { speaker: 'Snippy', text: `It's a bit locked right now, though. Gotta prove you're worthy!` },
      ],
      paid: `Snippy will offer hints on how to unlock the computer, or if unlocked, guide the user through Roli's professional portfolio and projects.`,
    },
    actionTarget: 'Requires payment (Stripe) or bypass code (Calculator) to unlock; then links to portfolio',
    visualFeedback: 'Pulsing lock icon on hover when locked',
    position: {
      x: 40,
      y: 45,
      width: 20,
      height: 25,
    },
  },
  {
    id: 'OBJ_04',
    assetName: 'Plant',
    type: 'Interactive (Growth)',
    initialState: {
      isWatered: false,
      growthStage: 0,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Look at the little plant! It loves a good drink!` },
        { speaker: 'User', text: `Can I water it?` },
        { speaker: 'Snippy', text: `If you have a watering can, maybe!` },
      ],
      paid: `Snippy will prompt the user to water the plant, explain its significance to Roli, and track its growth.`,
    },
    actionTarget: 'Watering mechanic; changes state, eventually yields a reward/clue',
    visualFeedback: 'Sparkle on hover when needs watering',
    position: {
      x: 10,
      y: 70,
      width: 10,
      height: 15,
    },
  },
  {
    id: 'OBJ_05',
    assetName: 'Bookshelf',
    type: 'Interactive (Book Selection)',
    initialState: {
      booksRead: [],
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `So many books! Roli reads everything to learn new things!` },
        { speaker: 'User', text: `Can I browse them?` },
        { speaker: 'Snippy', text: `Some are for looking, some are for learning!` },
      ],
      paid: `Snippy will guide the user to specific books, revealing insights into Roli's learning journey or project inspirations.`,
    },
    actionTarget: 'Click to browse books, reveals mini-insights or clues',
    visualFeedback: 'Subtle text highlight on book titles on hover',
    position: {
      x: 75,
      y: 30,
      width: 20,
      height: 50,
    },
  },
  {
    id: 'OBJ_06',
    assetName: 'Lamp',
    type: 'Toggle (Light)',
    initialState: {
      isLit: false,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `It gets a bit dark in here sometimes, doesn't it?` },
        { speaker: 'User', text: `Can I turn it on?` },
        { speaker: 'Snippy', text: `Only if you find the switch!` },
      ],
      paid: `Snippy will react to the lamp's state, encouraging the user to toggle it for aesthetic changes or to reveal hidden elements.`,
    },
    actionTarget: 'Toggle light on/off; changes room ambience or reveals hidden interactive elements',
    visualFeedback: 'Light glow on hover (on/off state)',
    position: {
      x: 5,
      y: 30,
      width: 10,
      height: 30,
    },
  },
  {
    id: 'OBJ_07',
    assetName: 'Calculator (with hidden input)',
    type: 'Utility / Bypass',
    initialState: {
      input: '',
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `A calculator! For super important math things, or… secrets!` },
        { speaker: 'User', text: `Secrets?` },
        { speaker: 'Snippy', text: `Maybe! Roli loves a good puzzle!` },
      ],
      paid: `Snippy will provide cryptic hints or direct instructions for using the calculator to find a bypass code or solve a mini-puzzle.`,
    },
    actionTarget: 'Numerical input for Computer bypass code',
    visualFeedback: 'Keypad highlight on hover',
    position: {
      x: 50,
      y: 55,
      width: 10,
      height: 10,
    },
  },
  {
    id: 'OBJ_08',
    assetName: 'Painting (on wall)',
    type: 'Decorative / Clue',
    initialState: {
      isInspected: false,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Such a lovely painting! Roli says it's very… inspiring!` },
        { speaker: 'User', text: `What's it a painting of?` },
        { speaker: 'Snippy', text: `You'll have to look closer!` },
      ],
      paid: `Snippy will reveal deeper meaning behind the painting or suggest it holds a clue related to Roli's projects.`,
    },
    actionTarget: 'Click to inspect; reveals lore or a clue',
    visualFeedback: 'Outline highlight on hover',
    position: {
      x: 30,
      y: 10,
      width: 20,
      height: 25,
    },
  },
  {
    id: 'OBJ_09',
    assetName: 'Coffee Mug',
    type: 'Decorative / Small interaction',
    initialState: {
      isEmpty: true,
    },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: `Roli's favorite mug! For all the thinking fuel!` },
        { speaker: 'User', text: `Is it empty?` },
        { speaker: 'Snippy', text: `Always! Roli drinks it too fast!` },
      ],
      paid: `Snippy will comment on the mug's state, perhaps prompting the user to "refill" it for a minor interaction or just to provide a cozy ambiance.`,
    },
    actionTarget: 'Click to inspect; maybe a refill animation',
    visualFeedback: 'Gentle shimmer on hover',
    position: {
      x: 48,
      y: 60,
      width: 5,
      height: 7,
    },
  },
];