'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { roomObjects as initialRoomObjects, RoomObject, DialogueEntry } from '@/lib/roomData';
import { getAssetPath } from '@/lib/assets';
import { loadImageAlphaMap, isPixelVisible, AlphaMap } from '@/lib/hitbox';
import DialogueBox from '@/components/DialogueBox';
import SnippyCharacter from '@/components/SnippyCharacter';
import ItemInteractionStage, { JukeboxTrack } from '@/components/ItemInteractionStage';
import ClockOverlay from '@/components/ClockOverlay';

type ObjectState = Record<string, Record<string, unknown>>;
type InspectionPhase = 'closed' | 'dialogue' | 'choice' | 'interacting';

function getObjectImageSrc(obj: RoomObject, state: Record<string, unknown>) {
  const activeKey = obj.altStateKey ?? obj.toggleKey;
  const showAlt = activeKey ? Boolean(state[activeKey]) : false;
  return showAlt && obj.imageSrcAlt ? obj.imageSrcAlt : obj.imageSrc;
}

function InspectedItemImage({
  obj,
  objectState: state,
}: {
  obj: RoomObject;
  objectState: ObjectState;
}) {
  const src = getObjectImageSrc(obj, state[obj.id] ?? {});
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getAssetPath(src ?? '')}
      alt=""
      className="pointer-events-none h-full w-full object-contain pixel-art drop-shadow-2xl"
    />
  );
}

function getInitialState(): ObjectState {
  return initialRoomObjects.reduce((acc, obj) => {
    acc[obj.id] = { ...obj.initialState };
    return acc;
  }, {} as ObjectState);
}

export default function Home() {
  const [roomObjects, setRoomObjects] = useState<RoomObject[]>(initialRoomObjects);
  const [repositionMode, setRepositionMode] = useState(false);
  const [objectState, setObjectState] = useState<ObjectState>(getInitialState);
  const [activeObject, setActiveObject] = useState<RoomObject | null>(
    () => initialRoomObjects.find((obj) => obj.id === 'OBJ_01') ?? null
  );
  const [inspectionPhase, setInspectionPhase] = useState<InspectionPhase>('closed');
  const [inspectedObject, setInspectedObject] = useState<RoomObject | null>(null);

  const mouseXRef = useRef<HTMLSpanElement | null>(null);
  const mouseYRef = useRef<HTMLSpanElement | null>(null);
  const clickXRef = useRef<HTMLSpanElement | null>(null);
  const clickYRef = useRef<HTMLSpanElement | null>(null);
  const clickLineRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [currentJukeboxTrack, setCurrentJukeboxTrack] = useState<JukeboxTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Live clock state shared between the idle-room overlay and the clock interaction.
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Aspect ratios keyed by object id
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  // Pixel-alpha maps keyed by image src for pixel-perfect hit detection
  const alphaMapsRef = useRef<Record<string, AlphaMap | null>>({});

  // Room container size for fitting object boxes to image aspect ratio
  const objectsLayerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // Drag / resize state
  const [dragState, setDragState] = useState<{
    id: string;
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const snippy = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_01') ?? null, [roomObjects]);
  const snippyCheckIn = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_02') ?? null, [roomObjects]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Read reposition query param after hydration to avoid server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRepositionMode(new URLSearchParams(window.location.search).has('reposition'));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Keep the global audio element in sync with the selected jukebox track and play state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }

    const audio = audioRef.current;

    if (currentJukeboxTrack && audio.src !== currentJukeboxTrack.src) {
      audio.src = currentJukeboxTrack.src;
      audio.currentTime = 0;
    }

    if (!currentJukeboxTrack) {
      audio.pause();
      return;
    }

    if (musicOn) {
      const playPromise = audio.play();
      playPromise.catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error('Audio playback failed:', err);
        }
      });
    } else {
      audio.pause();
    }
  }, [currentJukeboxTrack, musicOn]);

  // Pre-load alpha maps for all object images (including alt states) so
  // pixel-perfect hit detection is ready before the user clicks.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    initialRoomObjects.forEach((obj) => {
      [obj.imageSrc, obj.imageSrcAlt].forEach((src) => {
        if (!src || alphaMapsRef.current[src]) return;
        loadImageAlphaMap(getAssetPath(src)).then((map) => {
          if (map) alphaMapsRef.current[src] = map;
        });
      });
    });
  }, []);

  // Track the room container's rendered size so object boxes can be fitted
  // to their image aspect ratio within the position.width/height bounding box.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateSize = () => {
      const rect = objectsLayerRef.current?.getBoundingClientRect();
      if (rect) setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Global drag / resize listeners
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dX = ((e.clientX - dragState.startX) / window.innerWidth) * 100;
      const dY = ((e.clientY - dragState.startY) / window.innerHeight) * 100;

      setRoomObjects((prev) =>
        prev.map((obj) => {
          if (obj.id !== dragState.id) return obj;
          return {
            ...obj,
            position: {
              ...obj.position,
              x: dragState.type === 'move' ? dragState.initialX + dX : obj.position.x,
              y: dragState.type === 'move' ? dragState.initialY + dY : obj.position.y,
              width: dragState.type === 'resize' ? Math.max(1, dragState.initialW + dX) : obj.position.width,
              height: dragState.type === 'resize' ? Math.max(1, dragState.initialH + dY) : obj.position.height,
            },
          };
        })
      );
    };

    const handlePointerUp = () => setDragState(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  const toggleMusic = () => {
    if (!currentJukeboxTrack) {
      setCurrentJukeboxTrack({ title: 'Default Audio', src: getAssetPath('/assets/bg-music.mp3') });
      setMusicOn(true);
      return;
    }
    setMusicOn((prev) => !prev);
  };

  const performObjectToggle = (obj: RoomObject) => {
    const key = obj.toggleKey;
    if (!key) return;
    setObjectState((prev) => {
      const next = { ...prev, [obj.id]: { ...prev[obj.id] } };
      const current = next[obj.id][key];
      next[obj.id][key] = typeof current === 'boolean' ? !current : true;
      return next;
    });
  };

  const isClickOnVisiblePixel = (obj: RoomObject, e: React.MouseEvent<HTMLButtonElement>): boolean => {
    const src = getObjectImageSrc(obj, objectState[obj.id] ?? {});
    if (!src) return true;
    const alphaMap = alphaMapsRef.current[src];
    if (!alphaMap) return true;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return isPixelVisible(alphaMap, x, y, rect.width, rect.height);
  };

  const handleObjectClick = async (obj: RoomObject, e: React.MouseEvent) => {
    if (repositionMode || inspectedObject) return;
    e.stopPropagation();

    const visible = await isClickOnVisiblePixel(obj, e as React.MouseEvent<HTMLButtonElement>);
    if (!visible) return;

    // Snippy (OBJ_01) and Snippy check-in (OBJ_02) keep the old bottom-dialogue behavior.
    if (obj.id === 'OBJ_01' || obj.id === 'OBJ_02') {
      setActiveObject(obj);
      setObjectState((prev) => {
        const next = { ...prev, [obj.id]: { ...prev[obj.id] } };
        next[obj.id].isInteracted = true;
        return next;
      });
      return;
    }

    // Room items: start the pick-up/inspect flow.
    setInspectedObject(obj);
    setInspectionPhase('dialogue');
    setObjectState((prev) => {
      const next = { ...prev, [obj.id]: { ...prev[obj.id] } };
      next[obj.id].isInteracted = true;
      return next;
    });
  };

  const handleSnippyClick = (e: React.MouseEvent) => {
    if (repositionMode || inspectedObject) return;
    if (!snippyCheckIn) return;
    handleObjectClick(snippyCheckIn, e);
  };

  const handleDialogueFinished = () => {
    setInspectionPhase('choice');
  };

  const handleInteract = () => {
    if (!inspectedObject) return;
    setInspectionPhase('interacting');
    // Generic toggles are now handled inside ItemInteractionStage so the user
    // sees a dedicated "Activate" step. Only objects with custom interaction
    // stages are skipped here.
  };

  const handleExit = () => {
    setInspectionPhase('closed');
    setInspectedObject(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateCoordRefs(x, y, true);
  };

  const updateCoordRefs = (x: number, y: number, isClick: boolean) => {
    if (isClick) {
      if (clickXRef.current) clickXRef.current.textContent = x.toFixed(2);
      if (clickYRef.current) clickYRef.current.textContent = y.toFixed(2);
      if (clickLineRef.current) clickLineRef.current.style.display = 'block';
    } else {
      if (mouseXRef.current) mouseXRef.current.textContent = x.toFixed(2);
      if (mouseYRef.current) mouseYRef.current.textContent = y.toFixed(2);
    }
  };

  const handleBackgroundMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateCoordRefs(x, y, false);
  };

  const updatePosition = (id: string, key: keyof RoomObject['position'], value: number) => {
    setRoomObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, position: { ...obj.position, [key]: value } }
          : obj
      )
    );
  };

  const copyRoomData = () => {
    const lines = roomObjects.map(
      (obj) => `    // ${obj.id} - ${obj.assetName}\n    position: { x: ${obj.position.x}, y: ${obj.position.y}, width: ${obj.position.width}, height: ${obj.position.height} },`
    );
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    console.log('REPOSITION_DATA_START\n' + text + '\nREPOSITION_DATA_END');
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const getDialogue = (obj: RoomObject): DialogueEntry[] => {
    const state = objectState[obj.id] ?? {};

    if (obj.id === 'OBJ_02') {
      const allOthersInteracted = roomObjects
        .filter((o) => o.id !== 'OBJ_01' && o.id !== 'OBJ_02')
        .every((o) => objectState[o.id]?.isInteracted === true);

      if (allOthersInteracted) {
        return [obj.dialogue.free[obj.dialogue.free.length - 1] ?? obj.dialogue.free[0]];
      }
      return [obj.dialogue.free[0]];
    }

    if (obj.id === 'OBJ_05' && state.isFed) {
      return [obj.dialogue.free[1] ?? obj.dialogue.free[0]];
    }

    if (obj.id === 'OBJ_12') {
      return state.isOpen === false ? [obj.dialogue.free[1] ?? obj.dialogue.free[0]] : [obj.dialogue.free[0]];
    }

    return obj.dialogue.free;
  };

  // Compute the actual rendered position/size for an object with a known image
  // aspect ratio, treating position.width/height as a maximum bounding box and
  // fitting the image inside it with `object-fit: contain` semantics.
  const getFittedStyle = (
    position: RoomObject['position'],
    ratio: number | undefined
  ): React.CSSProperties => {
    if (!ratio || !containerSize) {
      return {
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      };
    }

    const boxWidthPx = containerSize.width * (position.width / 100);
    const boxHeightPx = containerSize.height * (position.height / 100);
    const boxAspectRatio = boxWidthPx / boxHeightPx;

    let actualWidthPx: number;
    let actualHeightPx: number;

    if (boxAspectRatio > ratio) {
      // Bounding box is wider relative to height than the image; height binds.
      actualHeightPx = boxHeightPx;
      actualWidthPx = actualHeightPx * ratio;
    } else {
      // Bounding box is taller relative to width than the image; width binds.
      actualWidthPx = boxWidthPx;
      actualHeightPx = actualWidthPx / ratio;
    }

    const actualWidthPercent = (actualWidthPx / containerSize.width) * 100;
    const actualHeightPercent = (actualHeightPx / containerSize.height) * 100;

    return {
      left: `${position.x + (position.width - actualWidthPercent) / 2}%`,
      top: `${position.y + (position.height - actualHeightPercent) / 2}%`,
      width: `${actualWidthPercent}%`,
      height: `${actualHeightPercent}%`,
    };
  };

  // Cached images never fire `onLoad` again once already loaded (naturalWidth
  // is readable immediately via the ref instead), so this runs on every
  // mount/update as a fallback — onLoad below still covers true first-loads.
  const captureImageMeta = (img: HTMLImageElement | null, obj: RoomObject) => {
    if (!img?.complete || !img.naturalWidth || !img.naturalHeight) return;
    setAspectRatios((prev) =>
      prev[obj.id] === img.naturalWidth / img.naturalHeight
        ? prev
        : { ...prev, [obj.id]: img.naturalWidth / img.naturalHeight }
    );
    const src = getObjectImageSrc(obj, objectState[obj.id] ?? {});
    if (src && !alphaMapsRef.current[src]) {
      loadImageAlphaMap(getAssetPath(src)).then((map) => {
        if (map) alphaMapsRef.current[src] = map;
      });
    }
  };

  const handleObjectPointerDown = (obj: RoomObject, e: React.PointerEvent) => {
    if (!repositionMode) return;
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      id: obj.id,
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      initialX: obj.position.x,
      initialY: obj.position.y,
      initialW: obj.position.width,
      initialH: obj.position.height,
    });
  };

  const handleResizePointerDown = (obj: RoomObject, e: React.PointerEvent) => {
    if (!repositionMode) return;
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      id: obj.id,
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      initialX: obj.position.x,
      initialY: obj.position.y,
      initialW: obj.position.width,
      initialH: obj.position.height,
    });
  };

  const isInspecting = inspectedObject !== null;
  const dimLevel = inspectionPhase === 'interacting' ? 'bg-black/80' : 'bg-black/50';

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Speaker / music toggle */}
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={musicOn ? 'Mute background music' : 'Play background music'}
        className="absolute top-4 left-4 z-50 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90"
      >
        {musicOn ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14 3.23v17.54c0 .8-.88 1.28-1.55.84L6.5 16.5H3.75A1.75 1.75 0 0 1 2 14.75v-5.5C2 8.25 2.78 7.5 3.75 7.5H6.5l5.95-4.61c.67-.44 1.55.04 1.55.84ZM18 9.5a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0v-5Z" />
            <path d="M20.25 12a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 .75-.75Z" />
            <path d="M17.47 7.47a.75.75 0 0 1 1.06 0c1.95 1.95 1.95 5.11 0 7.06a.75.75 0 1 1-1.06-1.06 3.737 3.737 0 0 0 0-4.94.75.75 0 0 1 0-1.06Z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M14 3.23v17.54c0 .8-.88 1.28-1.55.84L6.5 16.5H3.75A1.75 1.75 0 0 1 2 14.75v-5.5C2 8.25 2.78 7.5 3.75 7.5H6.5l5.95-4.61c.67-.44 1.55.04 1.55.84Z" />
            <path d="M18.78 5.22a.75.75 0 0 0-1.06 1.06L19.94 8.5l-2.22 2.22a.75.75 0 1 0 1.06 1.06l2.22-2.22 2.22 2.22a.75.75 0 1 0 1.06-1.06L21.06 7.44l2.22-2.22a.75.75 0 0 0-1.06-1.06L20 6.38l-2.22-2.22Z" />
          </svg>
        )}
      </button>

      {/* Coordinate readout (reposition mode only) */}
      {repositionMode && (
        <div className="absolute top-4 right-4 z-50 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
          <div>Mouse: X <span ref={mouseXRef}>0.00</span>%, Y <span ref={mouseYRef}>0.00</span>%</div>
          <div ref={clickLineRef} className="hidden text-xs text-gray-300">
            Click: X <span ref={clickXRef}>0.00</span>%, Y <span ref={clickYRef}>0.00</span>%
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 z-0 h-full w-full"
        onClick={handleBackgroundClick}
        onMouseMove={handleBackgroundMouseMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetPath('/assets/room_background_pixel_art_202607101242.png')}
          alt="Cozy Lo-Fi Pixel Art Room Background"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Dim overlay during inspection */}
      <AnimatePresence>
        {isInspecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-20 ${dimLevel}`}
          />
        )}
      </AnimatePresence>

      {/* Interactive Objects Layer */}
      <div className="absolute inset-0 z-10" ref={objectsLayerRef}>
        {roomObjects.map((obj) => {
          if (obj.id === 'OBJ_01' || obj.id === 'OBJ_02') return null;

          const state = objectState[obj.id] ?? {};
          const isToggled = obj.toggleKey ? Boolean(state[obj.toggleKey]) : false;
          const activeKey = obj.altStateKey ?? obj.toggleKey;
          const showAlt = activeKey ? Boolean(state[activeKey]) : false;
          const src = showAlt && obj.imageSrcAlt ? obj.imageSrcAlt : obj.imageSrc;
          const ratio = aspectRatios[obj.id];
          const isInspected = inspectedObject?.id === obj.id;
          const isDecorative = obj.decorative ?? false;

          // Decorative objects are purely visual in normal mode and should not
          // respond to clicks or show hover highlights.
          const isInteractive = !isDecorative;

          return (
            <motion.button
              key={obj.id}
              layoutId={`inspect-${obj.id}`}
              type="button"
              onClick={isInteractive ? (e) => handleObjectClick(obj, e) : undefined}
              onPointerDown={(e) => handleObjectPointerDown(obj, e)}
              className={`absolute transition-all duration-200 focus:outline-none ${
                repositionMode
                  ? 'cursor-move border border-dashed border-white/50 bg-white/10 hover:bg-white/20'
                  : isInteractive
                    ? `cursor-pointer rounded-lg hover:opacity-100 ${
                        obj.imageSrc
                          ? 'bg-transparent opacity-90 hover:opacity-100'
                          : `border-2 border-dashed ${
                              isToggled
                                ? 'border-yellow-300 bg-yellow-300/20 opacity-80'
                                : 'border-white/30 bg-white/10 opacity-40 hover:bg-white/20'
                            }`
                      }`
                    : 'pointer-events-none bg-transparent'
              }`}
              style={{
                ...getFittedStyle(obj.position, obj.imageSrc ? ratio : undefined),
                opacity: isInspecting && !isInspected ? 0.3 : undefined,
              }}
              title={obj.assetName}
              aria-label={obj.assetName}
            >
              {obj.imageSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAssetPath(src ?? '')}
                    alt=""
                    className="pointer-events-none h-full w-full object-contain pixel-art drop-shadow-lg"
                    ref={(el) => captureImageMeta(el, obj)}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        setAspectRatios((prev) => ({
                          ...prev,
                          [obj.id]: img.naturalWidth / img.naturalHeight,
                        }));
                      }
                      const src = getObjectImageSrc(obj, objectState[obj.id] ?? {});
                      if (src) {
                        loadImageAlphaMap(getAssetPath(src)).then((map) => {
                          if (map) alphaMapsRef.current[src] = map;
                        });
                      }
                    }}
                  />
                  {/* Live clock overlay for OBJ_14 */}
                  {obj.id === 'OBJ_14' && <ClockOverlay selectedTimezone={selectedTimezone} />}
                </>
              ) : (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-[10px] leading-tight text-white/90 drop-shadow md:text-xs">
                  {obj.assetName}
                  <br />({obj.id})
                </span>
              )}

              {/* Resize handle in reposition mode */}
              {repositionMode && (
                <span
                  role="button"
                  aria-label={`Resize ${obj.assetName}`}
                  tabIndex={0}
                  onPointerDown={(e) => handleResizePointerDown(obj, e)}
                  className="absolute -bottom-1 -right-1 z-20 h-3 w-3 cursor-nwse-resize rounded-sm bg-yellow-400 hover:bg-yellow-300"
                  style={{ transform: 'translate(50%, 50%)' }}
                />
              )}
            </motion.button>
          );
        })}

        {snippy && (
          <SnippyCharacter
            data={snippy}
            onClick={handleSnippyClick}
            style={getFittedStyle(snippy.position, snippy.imageSrc ? aspectRatios[snippy.id] : undefined)}
            onImageLoad={(w, h) =>
              setAspectRatios((prev) => (prev[snippy.id] === w / h ? prev : { ...prev, [snippy.id]: w / h }))
            }
            repositionMode={repositionMode}
            onPointerDown={(e) => handleObjectPointerDown(snippy, e)}
            onResizePointerDown={(e) => handleResizePointerDown(snippy, e)}
          />
        )}
      </div>

      {/* Centered inspected item */}
      <AnimatePresence>
        {inspectedObject && (
          <motion.div
            layoutId={`inspect-${inspectedObject.id}`}
            className="fixed left-1/2 top-1/2 z-30 h-auto w-[min(60vw,60vh)] -translate-x-1/2 -translate-y-1/2"
            style={{ aspectRatio: aspectRatios[inspectedObject.id] }}
          >
            <InspectedItemImage obj={inspectedObject} objectState={objectState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snippy dialogue (bottom box) — only for OBJ_01/OBJ_02 */}
      {activeObject && !repositionMode && !isInspecting && (
        <DialogueBox
          entries={getDialogue(activeObject)}
          onClose={() => setActiveObject(null)}
        />
      )}

      {/* Inspected item dialogue */}
      {inspectedObject && inspectionPhase === 'dialogue' && !repositionMode && (
        <DialogueBox
          entries={getDialogue(inspectedObject)}
          onClose={handleDialogueFinished}
        />
      )}

      {/* Choice prompt after dialogue */}
      {inspectedObject && inspectionPhase === 'choice' && !repositionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center p-4">
          <div className="relative w-full max-w-4xl select-none rounded-lg border-4 border-white bg-black p-6 shadow-[0_0_0_4px_#000]">
            <div className="absolute -top-5 left-4 rounded bg-white px-3 py-1 text-lg text-black font-vt323">
              {inspectedObject.assetName}
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleInteract}
                className="rounded border-2 border-white bg-black px-6 py-2 font-vt323 text-2xl text-white transition hover:bg-white hover:text-black"
              >
                Interact
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="rounded border-2 border-white bg-black px-6 py-2 font-vt323 text-2xl text-white transition hover:bg-white hover:text-black"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interaction stage (extensible mini-game hook) */}
      {inspectedObject && inspectionPhase === 'interacting' && !repositionMode && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-end justify-center p-4">
          <div
            className={`relative flex w-full select-none flex-col rounded-lg border-4 border-white bg-black p-6 shadow-[0_0_0_4px_#000] ${
              inspectedObject.id === 'OBJ_20' ? 'h-full max-w-7xl' : 'max-w-4xl'
            }`}
          >
            <div className="absolute -top-5 left-4 rounded bg-white px-3 py-1 text-lg font-vt323 text-black">
              {inspectedObject.assetName}
            </div>
            <div className="flex h-full flex-col items-center gap-4 pt-2">
              <ItemInteractionStage
                obj={inspectedObject}
                onComplete={handleExit}
                onToggle={() => performObjectToggle(inspectedObject)}
                selectedTimezone={selectedTimezone}
                onTimezoneChange={setSelectedTimezone}
                currentJukeboxTrack={currentJukeboxTrack}
                isJukeboxPlaying={musicOn}
                onJukeboxTrackSelect={setCurrentJukeboxTrack}
                onJukeboxToggle={() => setMusicOn((prev) => !prev)}
              />
              <button
                type="button"
                onClick={handleExit}
                className="rounded border-2 border-white bg-black px-6 py-2 font-vt323 text-2xl text-white transition hover:bg-white hover:text-black"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {repositionMode && (
        <button
          type="button"
          onClick={() => setPanelCollapsed((c) => !c)}
          aria-label={panelCollapsed ? 'Expand reposition panel' : 'Collapse reposition panel'}
          className="fixed top-4 z-50 rounded-l bg-black/90 px-2 py-3 text-white transition-all"
          style={{ right: panelCollapsed ? 0 : '20rem' }}
        >
          {panelCollapsed ? '◀' : '▶'}
        </button>
      )}

      {repositionMode && !panelCollapsed && (
        <div className="fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-black/90 p-4 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Reposition Mode</h2>
            <button
              type="button"
              onClick={copyRoomData}
              aria-label="Copy position data to clipboard"
              className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500"
            >
              {copied ? 'Copied!' : 'Copy Data'}
            </button>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            Drag objects to move. Drag the yellow corner handle to resize. Edit values below for precision.
          </p>
          {roomObjects.map((obj) => (
            <div key={obj.id} className="mb-3 rounded bg-white/10 p-2">
              <p className="mb-1 text-xs font-semibold">{obj.assetName}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['x', 'y', 'width', 'height'] as const).map((key) => (
                  <label key={key} className="text-xs" htmlFor={`${obj.id}-${key}`}>
                    {key}
                    <input
                      id={`${obj.id}-${key}`}
                      name={`${obj.id}-${key}`}
                      type="number"
                      step="0.1"
                      value={obj.position[key]}
                      onChange={(e) =>
                        updatePosition(obj.id, key, parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 w-full rounded bg-white/20 px-1 py-0.5 text-xs text-white"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
