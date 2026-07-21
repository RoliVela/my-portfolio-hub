'use client';

import { useState } from 'react';
import { RoomObject } from '@/lib/roomData';
import CalculatorInteraction from './CalculatorInteraction';
import ClockInteraction from './ClockInteraction';
import DinoGame from './DinoGame';
import NeeDohInteraction from './NeeDohInteraction';
import PosterboardInteraction from './PosterboardInteraction';
import SuggestionBoxInteraction from './SuggestionBoxInteraction';
import WateringGame from './WateringGame';
import JukeboxInteraction from './JukeboxInteraction';
import KermitSimonSays from './KermitSimonSays';

export type JukeboxTrack = {
  title: string;
  src: string;
  isUserUpload?: boolean;
};

interface ItemInteractionStageProps {
  obj: RoomObject;
  onComplete?: () => void;
  onToggle?: () => void;
  selectedTimezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  currentJukeboxTrack?: JukeboxTrack | null;
  isJukeboxPlaying?: boolean;
  onJukeboxTrackSelect?: (track: JukeboxTrack | null) => void;
  onJukeboxToggle?: () => void;
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
  onToggle,
  selectedTimezone,
  onTimezoneChange,
  currentJukeboxTrack,
  isJukeboxPlaying,
  onJukeboxTrackSelect,
  onJukeboxToggle,
}: ItemInteractionStageProps) {
  const [activated, setActivated] = useState(false);

  const handleInteract = () => {
    onComplete?.();
  };

  if (obj.id === 'OBJ_14' && selectedTimezone && onTimezoneChange) {
    return <ClockInteraction selectedTimezone={selectedTimezone} onTimezoneChange={onTimezoneChange} />;
  }

  if (obj.id === 'OBJ_15') {
    return <NeeDohInteraction />;
  }

  if (obj.id === 'OBJ_03' || obj.id === 'OBJ_04' || obj.id === 'OBJ_06') {
    return <WateringGame onComplete={onComplete} onSuccess={onToggle} plantName={obj.assetName} />;
  }

  if (obj.id === 'OBJ_11') {
    return <CalculatorInteraction onComplete={onComplete} />;
  }

  if (obj.id === 'OBJ_16') {
    return <DinoGame onComplete={onComplete} />;
  }

  if (obj.id === 'OBJ_17') {
    return <SuggestionBoxInteraction onComplete={handleInteract} />;
  }

  if (obj.id === 'OBJ_20') {
    return <PosterboardInteraction onComplete={handleInteract} />;
  }

  if (obj.id === 'OBJ_13') {
    return <KermitSimonSays onComplete={handleInteract} />;
  }

  if (obj.id === 'OBJ_18') {
    return (
      <JukeboxInteraction
        currentTrack={currentJukeboxTrack ?? null}
        isPlaying={isJukeboxPlaying ?? false}
        onTrackSelect={onJukeboxTrackSelect ?? (() => {})}
        onTogglePlay={onJukeboxToggle ?? (() => {})}
      />
    );
  }

  const handleActivate = () => {
    onToggle?.();
    setActivated(true);
  };

  const handleDone = () => {
    handleInteract();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-vt323 text-xl text-white/80">
        {obj.toggleKey ? `Use the ${obj.assetName}?` : `Nothing more to do with the ${obj.assetName}.`}
      </p>
      {obj.toggleKey ? (
        <button
          type="button"
          onClick={handleActivate}
          disabled={activated}
          className={`rounded px-6 py-2 font-vt323 text-xl text-black transition ${
            activated
              ? 'bg-gray-500/50 text-white/70 opacity-60'
              : 'bg-white hover:bg-gray-200'
          }`}
        >
          {activated ? 'Activated' : 'Activate'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDone}
          className="rounded bg-white px-6 py-2 font-vt323 text-xl text-black transition hover:bg-gray-200"
        >
          Done
        </button>
      )}
    </div>
  );
}
