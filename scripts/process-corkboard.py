#!/usr/bin/env python3
"""Resize/compress Corkboard Images for web display."""
import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.expanduser("~/Claudes Stuff/Corkboard Images")
DEST_DIR = os.path.join(SCRIPT_DIR, "..", "public", "assets", "corkboard")

os.makedirs(DEST_DIR, exist_ok=True)

MAX_DIM = 800

for filename in os.listdir(SRC_DIR):
    if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
        continue
    src_path = os.path.join(SRC_DIR, filename)
    # Normalize extension to .jpg for compressed output
    name = os.path.splitext(filename)[0]
    dest_path = os.path.join(DEST_DIR, f"{name}.jpg")
    try:
        with Image.open(src_path) as img:
            # Convert to RGB for JPEG output
            if img.mode in ("RGBA", "P"):
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = rgb_img
            else:
                img = img.convert("RGB")
            # Downscale if larger than MAX_DIM
            w, h = img.size
            if max(w, h) > MAX_DIM:
                ratio = MAX_DIM / max(w, h)
                img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
            img.save(dest_path, "JPEG", quality=85, optimize=True)
        print(f"Processed {filename} -> {dest_path}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")
