// lib/roomData.ts - Version: 2026-07-15
// NOTE: Positions for objects without dedicated background art are rough
// placeholder guesses and should be updated once final pixel-art assets exist.

export interface DialogueEntry {
  speaker: 'Snippy' | 'User';
  text: string;
}

export interface RoomObject {
  id: string;
  assetName: string;
  type: string;
  initialState: Record<string, unknown>;
  /** Optional state key to flip (true/false) when the object is clicked. */
  toggleKey?: string;
  /** Optional path to a real pixel-art asset in /public/assets. */
  imageSrc?: string;
  dialogue: {
    free: DialogueEntry[];
    paid: string;
  };
  actionTarget: string;
  visualFeedback: string;
  isInitialDialogue?: boolean;
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
    initialState: { isInteracted: false },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: "Wow, Roli's room sure is cool! I wonder if it's this tidy in real life." },
        { speaker: 'Snippy', text: "You can look around or do a one time payment to use Roli's paid websites, though I've heard there's a way around that." },
      ],
      paid: 'Upon paying, the pay button will become a talk button on the UI. From here, the user can ask Snippy anything, and the LLM will provide a response.',
    },
    actionTarget: 'Triggers main chat terminal overlay',
    visualFeedback: 'Launches with text dialogue upon the website loading up.',
    imageSrc: '/assets/snippy.png',
    isInitialDialogue: true,
    position: { x: 44, y: 78, width: 12, height: 16 },
  },
  {
    id: 'OBJ_02',
    assetName: 'Snippy (Scissors)',
    type: 'Click / Inspect',
    initialState: { isInteracted: false },
    dialogue: {
      free: [
        { speaker: 'Snippy', text: 'Are you having fun? There\'s still some stuff you haven\'t looked at yet. Keep looking around.' },
        { speaker: 'Snippy', text: 'Wow, you went through the whole website! Hey this is Roli and I just wanna say I really appreciate you bro, thanks for using the website (:' },
      ],
      paid: 'N/A',
    },
    actionTarget: 'Local dialog bubble',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 44, y: 78, width: 8, height: 10 },
  },
  {
    id: 'OBJ_03',
    assetName: 'Monstera',
    type: 'Click / Toggle',
    initialState: { isWatered: false },
    toggleKey: 'isWatered',
    imageSrc: '/assets/monstera.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'This is a monstera plant; we should water it, as these plants take a lot of water.' }],
      paid: 'N/A',
    },
    actionTarget: 'Toggle plant watering animation state',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 8, y: 68, width: 8, height: 14 },
  },
  {
    id: 'OBJ_04',
    assetName: 'Snake plant',
    type: 'Click / Toggle',
    initialState: { isWatered: false },
    toggleKey: 'isWatered',
    imageSrc: '/assets/snake-plant.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'A snake plant. These are pretty common as houseplants, but we probably shouldn\'t water them that much, since they\'re known for being drought-tolerant.' }],
      paid: 'N/A',
    },
    actionTarget: 'Toggle plant watering animation state',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 16, y: 70, width: 6, height: 12 },
  },
  {
    id: 'OBJ_05',
    assetName: 'Venus Fly Trap',
    type: 'Click / Toggle',
    initialState: { isFed: false },
    toggleKey: 'isFed',
    imageSrc: '/assets/venus_flytrap.png',
    dialogue: {
      free: [
        { speaker: 'Snippy', text: 'Yikes! A venus fly trap! You can feed it, but I\'ll be looking away because those always give me the creeps.' },
        { speaker: 'Snippy', text: 'It looks pretty busy there. These plants can take 7-12 days to completely digest their prey, so don\'t bother waiting.' },
      ],
      paid: 'N/A',
    },
    actionTarget: 'Toggle plant feeding animation state. This plant is no longer available to interact with.',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 24, y: 72, width: 6, height: 10 },
  },
  {
    id: 'OBJ_06',
    assetName: 'Senecio Rowleyanus',
    type: 'Click / Toggle',
    initialState: { isWatered: false },
    toggleKey: 'isWatered',
    imageSrc: '/assets/senecio.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Senecio Rowleyanus, *heheh*, it has the word anus in it. People usually call it the "String of Pearls" plant. You can water it if you\'d like; it\'s looking a little dry.' }],
      paid: 'N/A',
    },
    actionTarget: 'Toggle plant watering animation state',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 30, y: 74, width: 6, height: 10 },
  },
  {
    id: 'OBJ_07',
    assetName: 'Light / Neon Sign',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/neon-sign.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Cool sign. Really adds to the chill lofi vibe Roli was going for here.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 55, y: 18, width: 18, height: 10 },
  },
  {
    id: 'OBJ_08',
    assetName: 'Lamp next to the desk',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/desk-lamp.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'It kinda looks like the Pixar lamp.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 38, y: 52, width: 8, height: 14 },
  },
  {
    id: 'OBJ_09',
    assetName: 'String lights hanging above desk',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/string-lights.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'So sparkly! Roli should add some of these to his room in real life.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 35, y: 25, width: 30, height: 6 },
  },
  {
    id: 'OBJ_10',
    assetName: 'Lamp next to the bed',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/bed-lamp.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Getting sleepy already?' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 78, y: 48, width: 8, height: 16 },
  },
  {
    id: 'OBJ_11',
    assetName: 'Calculator',
    type: 'Input / Text Entry',
    initialState: { input: '' },
    imageSrc: '/assets/calculator.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Just a normal calculator. Unless Roli gave you a code of some type... *psst, this is roli, feel free to message me for the code*' }],
      paid: 'N/A',
    },
    actionTarget: 'Verifies hidden string input for Free bypass',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 52, y: 58, width: 7, height: 9 },
  },
  {
    id: 'OBJ_12',
    assetName: 'Window blinds',
    type: 'Click / Toggle',
    initialState: { isOpen: true },
    toggleKey: 'isOpen',
    imageSrc: '/assets/window-blinds.png',
    dialogue: {
      free: [
        { speaker: 'Snippy', text: 'Laredo is truly a beautiful city. I always wondered how Los Angeles took the name LA when there is a city as beautiful as this.' },
        { speaker: 'Snippy', text: 'Aww shucks. I was really enjoying that view.' },
      ],
      paid: 'N/A',
    },
    actionTarget: 'Changes the window visual in the room to have the blinds closed',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 12, y: 22, width: 18, height: 28 },
  },
  {
    id: 'OBJ_13',
    assetName: 'Kermit (Cat)',
    type: 'Click / Mini-game',
    initialState: { isFed: true },
    imageSrc: '/assets/kermit.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Kermit!!! This is Roli\'s cat, and she is so awesome. She is 7 years old and really friendly around everyone *assuming she\'s already been fed*. Do you want to try petting her?' }],
      paid: 'N/A',
    },
    actionTarget: 'Launches localized retro arcade overlay',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 70, y: 72, width: 10, height: 12 },
  },
  {
    id: 'OBJ_14',
    assetName: 'Clock',
    type: 'Click / Pull Interaction',
    initialState: { isPulled: false },
    toggleKey: 'isPulled',
    imageSrc: '/assets/clock.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'A digital clock. You can change the time zone, but if this website is coded correctly, it should already be accurate.' }],
      paid: 'N/A',
    },
    actionTarget: 'Pull action physics engine callback',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 62, y: 20, width: 8, height: 10 },
  },
  {
    id: 'OBJ_15',
    assetName: 'Nee-Doh (Stress Ball)',
    type: 'Click / Drag',
    initialState: { isSquished: false },
    toggleKey: 'isSquished',
    imageSrc: '/assets/nee-doh.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Whoa, he got a Nee-Doh? What did he have to do to get that? We should play with it, I\'m sure Roli wouldn\'t mind.' }],
      paid: 'N/A',
    },
    actionTarget: 'Squish animation triggering local state',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 48, y: 62, width: 6, height: 6 },
  },
  {
    id: 'OBJ_16',
    assetName: 'Computer Console',
    type: 'Navigation / Interaction',
    initialState: { isUnlocked: false },
    imageSrc: '/assets/computer.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Aww shucks. You haven\'t paid yet, so we have no connection to Roli\'s programs. Well, at least we have the dinosaur game to play.' }],
      paid: 'Nice! *in a hacker voice* We\'re in... Let\'s see what cool stuff we can find hidden away here.',
    },
    actionTarget: 'Conditional branch overlay depending on Auth status',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 42, y: 48, width: 16, height: 18 },
  },
  {
    id: 'OBJ_17',
    assetName: 'Suggestion box next to computer',
    type: 'Text upload',
    initialState: { hasMessage: false },
    imageSrc: '/assets/suggestion-box.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'A suggestion box. Feel free to drop in any comments, or if you\'d just like to write Roli a message. He appreciates all the feedback he can get.' }],
      paid: 'N/A',
    },
    actionTarget: 'Opens text box for the user to type in',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 60, y: 55, width: 8, height: 10 },
  },
  {
    id: 'OBJ_18',
    assetName: 'Record Player / Boombox',
    type: 'Click / Audio Toggle',
    initialState: { isPlaying: false },
    toggleKey: 'isPlaying',
    imageSrc: '/assets/record-player.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Epic! We can play music here! There\'s already something playing here, but feel free to change it up. Im always eager to hear some new tunes.' }],
      paid: 'music! Roli curates the absolute best beats for working. Let\'s make it extra cozy in here!',
    },
    actionTarget: 'Toggles background audio playlist track array stream',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 32, y: 55, width: 10, height: 10 },
  },
  {
    id: 'OBJ_19',
    assetName: 'Cozy Coffee Mug',
    type: 'Click / Inspect',
    initialState: { isInspected: false },
    toggleKey: 'isInspected',
    imageSrc: '/assets/coffee-mug.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Careful, it\'s hot! Roli runs on 50% caffeine, 25% logic, and 25% imagination. I don\'t drink coffee myself... it tends to rust my pivot pin.' }],
      paid: 'N/A',
    },
    actionTarget: 'Triggers localized steam particle burst animation',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 50, y: 60, width: 5, height: 6 },
  },
  {
    id: 'OBJ_20',
    assetName: 'Polaroid Wall Board',
    type: 'Click / Image Modal',
    initialState: { isViewed: false },
    toggleKey: 'isViewed',
    imageSrc: '/assets/polaroid-board.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Look at all these memories! That one\'s Kermit looking majestic, and over there is the very first messy sketch of this exact room! Isn\'t it wonderful how big ideas grow?' }],
      paid: 'N/A',
    },
    actionTarget: 'Opens image gallery overlay of personal and team photos',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 68, y: 24, width: 14, height: 18 },
  },
];
