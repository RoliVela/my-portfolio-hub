#!/usr/bin/env python3
"""Trim sprite PNGs to their visible (non-transparent) bounding boxes.

Requires Pillow:
    pip install Pillow

Run from the repo root:
    python3 scripts/trim-sprites.py

Overwrites PNG files in public/assets/ with trimmed versions.
Skips background images and decorative items that should keep their canvas.

For objects with multiple visual states (e.g. on/off), both states are trimmed
to the *combined* bounding box of all states so toggling does not change the
object's size or anchor point.
"""

import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "..", "public", "assets")

# Files to skip (backgrounds / decorative items whose canvas must stay intact)
SKIP_FILES = {
    "room_background_pixel_art_202607101242.png",
    "room_background_pixel_art.png",
    "white-monster.png",
}

# Alt-state pairs that must share the same canvas so toggling doesn't jump.
# Each tuple lists all states for one object.
STATE_GROUPS: list[list[str]] = [
    ["neon-sign-off.png", "neon-sign-on.png"],
    ["desk-lamp-off.png", "desk-lamp-on.png"],
    ["string-lights-off.png", "string-lights-on.png"],
    ["bed-lamp-off.png", "bed-lamp-on.png"],
    ["window-blinds-open.png", "window-blinds-closed.png"],
    ["computer-locked.png", "computer-unlocked.png"],
    ["record-player-off.png", "record-player-on.png"],
]


ALPHA_THRESHOLD = 10


def get_bbox(path: str) -> tuple[int, int, int, int] | None:
    """Return the bounding box of visible pixels (alpha >= threshold), or None."""
    with Image.open(path) as img:
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        alpha = img.split()[-1]
        # Mask out pixels below the threshold so only visible content counts.
        mask = alpha.point(lambda p: 255 if p >= ALPHA_THRESHOLD else 0)
        bbox = img.crop((0, 0, img.width, img.height))
        bbox.putalpha(mask)
        return bbox.getbbox()


def combined_bbox(bboxes: list[tuple[int, int, int, int]]) -> tuple[int, int, int, int]:
    """Return the smallest rectangle that contains all given bboxes."""
    left = min(b[0] for b in bboxes)
    upper = min(b[1] for b in bboxes)
    right = max(b[2] for b in bboxes)
    lower = max(b[3] for b in bboxes)
    return (left, upper, right, lower)


def crop_to(path: str, bbox: tuple[int, int, int, int]) -> bool:
    """Crop a single image to the given bbox, returning True if changed."""
    with Image.open(path) as img:
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        width, height = img.size
        if bbox == (0, 0, width, height):
            return False
        cropped = img.crop(bbox)
        cropped.save(path, "PNG")
        return True


def trim_single(path: str) -> tuple[bool, tuple[int, int, int, int] | None]:
    """Trim an image to its own visible bounding box."""
    bbox = get_bbox(path)
    if bbox is None:
        return False, None
    changed = crop_to(path, bbox)
    return changed, bbox


def main() -> None:
    assets_dir = os.path.abspath(ASSETS_DIR)
    os.makedirs(assets_dir, exist_ok=True)

    # Collect all PNGs
    png_files = {f for f in os.listdir(assets_dir) if f.lower().endswith(".png")}

    trimmed_count = 0
    skipped_count = 0
    unchanged_count = 0

    # Determine which files are handled as state groups
    state_group_files = set()
    for group in STATE_GROUPS:
        state_group_files.update(group)

    # 1. Trim state groups to a shared combined bbox
    for group in STATE_GROUPS:
        paths = [os.path.join(assets_dir, f) for f in group if f in png_files]
        if not paths:
            continue

        bboxes: list[tuple[int, int, int, int]] = []
        for path in paths:
            bbox = get_bbox(path)
            if bbox is not None:
                bboxes.append(bbox)

        if not bboxes:
            print(f"Skipping state group {group} (fully transparent)")
            continue

        shared_bbox = combined_bbox(bboxes)
        print(f"State group {group} -> combined bbox {shared_bbox}")
        for filename in group:
            path = os.path.join(assets_dir, filename)
            if filename not in png_files:
                continue
            changed = crop_to(path, shared_bbox)
            if changed:
                trimmed_count += 1
                print(f"  Trimmed {filename}")
            else:
                unchanged_count += 1
                print(f"  Unchanged {filename}")

    # 2. Trim remaining individual sprites
    for filename in sorted(png_files):
        if filename in SKIP_FILES or filename in state_group_files:
            if filename in SKIP_FILES:
                skipped_count += 1
                print(f"Skipped {filename}")
            continue

        path = os.path.join(assets_dir, filename)
        try:
            changed, bbox = trim_single(path)
            if changed:
                trimmed_count += 1
                print(f"Trimmed {filename} -> bbox {bbox}")
            else:
                unchanged_count += 1
                print(f"Unchanged {filename}")
        except Exception as e:  # noqa: BLE001
            print(f"Error processing {filename}: {e}")

    print("\nDone.")
    print(f"  Trimmed:   {trimmed_count}")
    print(f"  Unchanged: {unchanged_count}")
    print(f"  Skipped:   {skipped_count}")


if __name__ == "__main__":
    main()
