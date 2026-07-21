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
  /** Optional alternate image shown when the alt-state condition is true. */
  imageSrcAlt?: string;
  /** Optional state key to check for the alternate image; defaults to toggleKey if omitted. */
  altStateKey?: string;
  /** Decorative objects are purely visual and not interactive in normal mode. */
  decorative?: boolean;
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
    position: { x: 31.6, y: 67.9, width: 22, height: 16 },
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
    position: { x: 44, y: 75.5, width: 6, height: 8 },
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
    position: { x: 10.65502763605442, y: -2.684318862275449, width: 16.59173044217687, height: 45.45097305389222 },
  },
  {
    id: 'OBJ_07',
    assetName: 'Light / Neon Sign',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/neon-sign-off.png',
    imageSrcAlt: '/assets/neon-sign-on.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Cool sign. Really adds to the chill lofi vibe Roli was going for here.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 27.415391156462583, y: 13.669535928143711, width: 23.924744897959183, height: 16.778162425149702 },
  },
  {
    id: 'OBJ_09',
    assetName: 'String lights hanging above desk',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/string-lights-off.png',
    imageSrcAlt: '/assets/string-lights-on.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'So sparkly! Roli should add some of these to his room in real life.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 75.88860544217688, y: 22.538080089820355, width: 21.536192602040817, height: 14.581306137724548 },
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
    position: { x: 85.20169005102042, y: 15.049588323353293, width: 17.35879039115646, height: 32.578592814371255 },
  },
  {
    id: 'OBJ_10',
    assetName: 'Lamp next to the bed',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/bed-lamp-off.png',
    imageSrcAlt: '/assets/bed-lamp-on.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Getting sleepy already?' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: -3.895036139455783, y: 47.72829341317366, width: 19.652848639455783, height: 21.137256736526947 },
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
    position: { x: 5.535448554421769, y: 65.09636976047905, width: 7.60671768707483, height: 6.259262724550897 },
  },
  {
    id: 'OBJ_12',
    assetName: 'Window blinds',
    type: 'Click / Toggle',
    initialState: { isOpen: true },
    toggleKey: 'isOpen',
    imageSrc: '/assets/window-blinds-closed.png',
    imageSrcAlt: '/assets/window-blinds-open.png',
    dialogue: {
      free: [
        { speaker: 'Snippy', text: 'Laredo is truly a beautiful city. I always wondered how Los Angeles took the name LA when there is a city as beautiful as this.' },
        { speaker: 'Snippy', text: 'Aww shucks. I was really enjoying that view.' },
      ],
      paid: 'N/A',
    },
    actionTarget: 'Changes the window visual in the room to have the blinds closed',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 38.552083333333336, y: 2.388847305389221, width: 45.81627338435374, height: 46.8312125748503 },
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
    position: { x: 18.5984800170068, y: 55.46687874251497, width: 11.98044217687075, height: 11.199008233532934 },
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
    position: { x: 54.06117134353742, y: 45.883794910179645, width: 10.812606292517005, height: 11.062874251497005 },
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
    position: { x: 66.5, y: 54.7, width: 7.8, height: 7.4 },
  },
  {
    id: 'OBJ_16',
    assetName: 'Computer Console',
    type: 'Navigation / Interaction',
    initialState: { isUnlocked: false },
    imageSrc: '/assets/computer-locked.png',
    imageSrcAlt: '/assets/computer-unlocked.png',
    altStateKey: 'isUnlocked',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Aww shucks. You haven\'t paid yet, so we have no connection to Roli\'s programs. Well, at least we have the dinosaur game to play.' }],
      paid: 'Nice! *in a hacker voice* We\'re in... Let\'s see what cool stuff we can find hidden away here.',
    },
    actionTarget: 'Conditional branch overlay depending on Auth status',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 70.26785714285714, y: 35.416822604790426, width: 25.078337585034014, height: 31.953312125748504 },
  },
  {
    id: 'OBJ_08',
    assetName: 'Lamp next to the desk',
    type: 'Click / Toggle',
    initialState: { isLit: false },
    toggleKey: 'isLit',
    imageSrc: '/assets/desk-lamp-off.png',
    imageSrcAlt: '/assets/desk-lamp-on.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'It kinda looks like the Pixar lamp.' }],
      paid: 'N/A',
    },
    actionTarget: 'Swaps localized layer opacity / texture',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 89.24771471088435, y: 43.390157185628745, width: 12.608205782312925, height: 21.715943113772454 },
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
    position: { x: 52.008662840136054, y: 59.03265344311377, width: 10.920705782312924, height: 6.283401946107785 },
  },
  {
    id: 'DECOR_WHITE_MONSTER',
    assetName: 'White Monster',
    type: 'Decorative',
    initialState: {},
    imageSrc: '/assets/white-monster.png',
    decorative: true,
    dialogue: { free: [], paid: 'N/A' },
    actionTarget: 'N/A',
    visualFeedback: 'N/A',
    position: { x: 58, y: 58, width: 4, height: 5 },
  },
  {
    id: 'OBJ_18',
    assetName: 'Record Player / Boombox',
    type: 'Click / Audio Toggle',
    initialState: { isPlaying: false },
    toggleKey: 'isPlaying',
    imageSrc: '/assets/record-player-off.png',
    imageSrcAlt: '/assets/record-player-on.png',
    dialogue: {
      free: [{ speaker: 'Snippy', text: 'Epic! We can play music here! There\'s already something playing here, but feel free to change it up. Im always eager to hear some new tunes.' }],
      paid: 'music! Roli curates the absolute best beats for working. Let\'s make it extra cozy in here!',
    },
    actionTarget: 'Toggles background audio playlist track array stream',
    visualFeedback: 'Yellow highlight on hover',
    position: { x: 8.78938137755102, y: 77.51062874251497, width: 20, height: 15.5 },
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
    position: { x: 86.14508928571428, y: 56.77984655688623, width: 10, height: 12 },
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
    position: { x: -3.817602040816327, y: 11.896051646706587, width: 23.81935586734694, height: 35.988491766467064 },
  },
  // Rendered last (drawn on top) so they aren't covered by the window/computer.
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
    position: { x: 70.06867559523809, y: 45.53284056886228, width: 11.079931972789115, height: 11.604883982035929 },
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
    position: { x: 48.01482780612245, y: 39.564464820359284, width: 9.317867772108844, height: 13.800523952095809 },
  },
  // Renders in front of everything.
  {
    id: 'DECOR_CHAIR',
    assetName: 'Chair',
    type: 'Decorative',
    initialState: {},
    imageSrc: '/assets/chair.png',
    decorative: true,
    dialogue: { free: [], paid: 'N/A' },
    actionTarget: 'N/A',
    visualFeedback: 'N/A',
    position: { x: 48, y: 50, width: 13, height: 18 },
  },
];
