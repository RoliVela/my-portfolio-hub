/**
 * Simple module-level singleton to keep dialogue talk-sound and background
 * music from overlapping. Whenever one starts, the other is paused.
 * Whichever started most recently wins; nothing auto-resumes.
 */

let musicAudio: HTMLAudioElement | null = null;
let dialogueAudio: HTMLAudioElement | null = null;

export function registerMusicAudio(audio: HTMLAudioElement | null): void {
  musicAudio = audio;
}

export function registerDialogueAudio(audio: HTMLAudioElement | null): void {
  dialogueAudio = audio;
}

export function pauseMusic(): void {
  if (musicAudio) {
    musicAudio.pause();
  }
}

export function pauseDialogueAudio(): void {
  if (dialogueAudio) {
    dialogueAudio.pause();
    dialogueAudio.currentTime = 0;
  }
}

export function playMusic(): void {
  pauseDialogueAudio();
  if (musicAudio) {
    musicAudio.play().catch(() => {});
  }
}

export function playDialogue(): void {
  pauseMusic();
  if (dialogueAudio) {
    dialogueAudio.play().catch(() => {});
  }
}
