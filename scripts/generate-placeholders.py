#!/usr/bin/env python3
"""Generate simple placeholder pixel-art sprites for room objects.

Requires Pillow:
    pip install Pillow

Run from the repo root:
    python3 scripts/generate-placeholders.py

Outputs PNG files to public/assets/.
"""

from PIL import Image, ImageDraw
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "assets")
SIZE = 64


def save(img, name):
    img.save(os.path.join(OUTPUT_DIR, name), "PNG")


def new():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def draw_monstera():
    img = new()
    d = ImageDraw.Draw(img)
    d.ellipse([16, 8, 48, 56], fill=(50, 205, 50, 255))
    d.polygon([(32, 56), (28, 40), (36, 40)], fill=(34, 100, 34, 255))
    return img


def draw_snake_plant():
    img = new()
    d = ImageDraw.Draw(img)
    for x in [18, 32, 46]:
        d.rectangle([x, 12, x + 6, 52], fill=(85, 107, 47, 255), outline=(50, 80, 30, 255))
    return img


def draw_senecio():
    img = new()
    d = ImageDraw.Draw(img)
    for i in range(8):
        x = 8 + (i % 4) * 14
        y = 10 + (i // 4) * 20
        d.ellipse([x, y, x + 10, y + 10], fill=(144, 238, 144, 255))
    return img


def draw_neon_sign():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([8, 20, 56, 44], fill=(255, 20, 147, 255), outline=(255, 255, 255, 255), width=3)
    return img


def draw_desk_lamp():
    img = new()
    d = ImageDraw.Draw(img)
    d.ellipse([20, 8, 44, 32], fill=(255, 215, 0, 255))
    d.rectangle([30, 28, 34, 48], fill=(100, 100, 100, 255))
    d.rectangle([20, 48, 44, 56], fill=(80, 80, 80, 255))
    return img


def draw_string_lights():
    img = new()
    d = ImageDraw.Draw(img)
    d.line([(8, 16), (56, 16)], fill=(255, 255, 255, 255), width=2)
    colors = [(255, 0, 0, 255), (0, 255, 0, 255), (255, 255, 0, 255), (0, 255, 255, 255)]
    for i, c in enumerate(colors):
        x = 14 + i * 12
        d.ellipse([x - 3, 20, x + 3, 30], fill=c)
    return img


def draw_bed_lamp():
    img = new()
    d = ImageDraw.Draw(img)
    d.ellipse([16, 8, 48, 40], fill=(255, 223, 186, 255))
    d.rectangle([28, 40, 36, 56], fill=(100, 100, 100, 255))
    return img


def draw_calculator():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([12, 8, 52, 56], fill=(150, 150, 150, 255), outline=(50, 50, 50, 255))
    d.rectangle([16, 12, 48, 20], fill=(0, 0, 0, 255))
    for y in range(24, 52, 8):
        for x in range(18, 50, 8):
            d.rectangle([x, y, x + 4, y + 4], fill=(80, 80, 80, 255))
    return img


def draw_blinds():
    img = new()
    d = ImageDraw.Draw(img)
    for y in range(0, SIZE, 8):
        d.rectangle([4, y, 60, y + 4], fill=(255, 255, 255, 255))
    return img


def draw_clock():
    img = new()
    d = ImageDraw.Draw(img)
    d.ellipse([8, 8, 56, 56], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
    d.line([(32, 32), (32, 18)], fill=(0, 0, 0, 255), width=2)
    d.line([(32, 32), (44, 32)], fill=(0, 0, 0, 255), width=2)
    return img


def draw_computer():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([8, 12, 56, 40], fill=(100, 100, 100, 255), outline=(200, 200, 200, 255), width=2)
    d.rectangle([22, 40, 42, 52], fill=(80, 80, 80, 255))
    d.rectangle([16, 16, 48, 32], fill=(0, 0, 0, 255))
    return img


def draw_suggestion_box():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([12, 16, 52, 48], fill=(160, 82, 45, 255), outline=(80, 40, 20, 255), width=2)
    d.rectangle([20, 24, 44, 28], fill=(0, 0, 0, 255))
    return img


def draw_record_player():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([8, 16, 56, 48], fill=(50, 50, 50, 255), outline=(150, 150, 150, 255), width=2)
    d.ellipse([18, 20, 46, 48], fill=(20, 20, 20, 255), outline=(255, 255, 255, 255), width=1)
    return img


def draw_coffee_mug():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([20, 16, 40, 48], fill=(139, 69, 19, 255), outline=(80, 40, 20, 255), width=2)
    d.ellipse([40, 20, 52, 36], fill=(139, 69, 19, 255), outline=(80, 40, 20, 255), width=2)
    d.ellipse([22, 12, 38, 18], fill=(255, 255, 255, 150))
    return img


def draw_polaroid_board():
    img = new()
    d = ImageDraw.Draw(img)
    d.rectangle([8, 8, 56, 56], fill=(210, 180, 140, 255), outline=(100, 80, 60, 255), width=2)
    d.rectangle([14, 14, 30, 26], fill=(255, 255, 255, 255))
    d.rectangle([34, 18, 50, 30], fill=(255, 255, 255, 255))
    d.rectangle([18, 34, 34, 50], fill=(255, 255, 255, 255))
    return img


sprites = {
    "monstera.png": draw_monstera,
    "snake-plant.png": draw_snake_plant,
    "senecio.png": draw_senecio,
    "neon-sign.png": draw_neon_sign,
    "desk-lamp.png": draw_desk_lamp,
    "string-lights.png": draw_string_lights,
    "bed-lamp.png": draw_bed_lamp,
    "calculator.png": draw_calculator,
    "window-blinds.png": draw_blinds,
    "clock.png": draw_clock,
    "computer.png": draw_computer,
    "suggestion-box.png": draw_suggestion_box,
    "record-player.png": draw_record_player,
    "coffee-mug.png": draw_coffee_mug,
    "polaroid-board.png": draw_polaroid_board,
}

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for name, fn in sprites.items():
        save(fn(), name)
        print(f"Generated {name}")
