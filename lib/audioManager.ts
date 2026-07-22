/**
 * Simple module-level singleton for dialogue talk-sound.
 * Music is left to its own React state and is no longer paused by dialogue.
 */

let dialogueAudio: HTMLAudioElement | null = null;

export function registerDialogueAudio(audio: HTMLAudioElement | null): void {
  dialogueAudio = audio;
}

export function playDialogue(): void {
  dialogueAudio?.play().catch(() => {});
}
