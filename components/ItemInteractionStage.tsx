'use client';

import { RoomObject } from '@/lib/roomData';
import ClockInteraction from './ClockInteraction';
import NeeDohInteraction from './NeeDohInteraction';
import PosterboardInteraction from './PosterboardInteraction';
import SuggestionBoxInteraction from './SuggestionBoxInteraction';

interface ItemInteractionStageProps {
  obj: RoomObject;
  onComplete?: () => void;
  selectedTimezone?: string;
  onTimezoneChange?: (timezone: string) => void;
}

/**
 * Extensible interaction stage for inspected room items.
 *
 * This is the hook point for future mini-games. For now, objects without a
 * dedicated mini-game fall back to performing their configured toggleKey action.
 * Add a case below (or a dynamic import map) to swap in a real mini-game for a
 * specific obj.id.
 */
export default function ItemInteractionStage({
  obj,
  onComplete,
  selectedTimezone,
  onTimezoneChange,
}: ItemInteractionStageProps) {
  const handleInteract = () => {
    onComplete?.();
  };

  if (obj.id === 'OBJ_14' && selectedTimezone && onTimezoneChange) {
    return <ClockInteraction selectedTimezone={selectedTimezone} onTimezoneChange={onTimezoneChange} />;
  }

  if (obj.id === 'OBJ_15') {
    return <NeeDohInteraction />;
  }

  if (obj.id === 'OBJ_17') {
    return <SuggestionBoxInteraction onComplete={handleInteract} />;
  }

  if (obj.id === 'OBJ_20') {
    return <PosterboardInteraction onComplete={handleInteract} />;
  }

  // Placeholder for future per-object mini-games.
  // Example:
  // if (obj.id === 'OBJ_13') return <KermitMiniGame onComplete={handleInteract} />;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-vt323 text-xl text-white/80">
        {obj.toggleKey ? `Use the ${obj.assetName}?` : `Nothing more to do with the ${obj.assetName}.`}
      </p>
      <button
        type="button"
        onClick={handleInteract}
        className="rounded bg-white px-6 py-2 font-vt323 text-xl text-black transition hover:bg-gray-200"
      >
        {obj.toggleKey ? 'Activate' : 'Done'}
      </button>
    </div>
  );
}
