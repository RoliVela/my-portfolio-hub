/**
 * Simple module-level singleton for dialogue talk-sound.
 * Music is left to its own React state and is no longer paused by dialogue.
 *
 * Also stores a global, persisted mute flag that all audio sources should
 * respect. UI components can use the `useIsMuted` hook to stay in sync.
 */

import { useEffect, useState } from 'react';

const MUTE_STORAGE_KEY = 'snippy-is-muted';

function loadMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveMuted(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(value));
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

let dialogueAudio: HTMLAudioElement | null = null;
let isMuted = loadMuted();
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function registerDialogueAudio(audio: HTMLAudioElement | null): void {
  dialogueAudio = audio;
}

export function playDialogue(): void {
  if (isMuted) return;
  dialogueAudio?.play().catch(() => {});
}

export function getIsMuted(): boolean {
  return isMuted;
}

export function setIsMuted(value: boolean): void {
  if (value === isMuted) return;
  isMuted = value;
  saveMuted(isMuted);
  notifyListeners();
}

export function toggleMute(): void {
  setIsMuted(!isMuted);
}

export function subscribeToMute(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useIsMuted(): boolean {
  const [muted, setMuted] = useState(getIsMuted);

  useEffect(() => {
    return subscribeToMute(() => setMuted(getIsMuted()));
  }, []);

  return muted;
}
