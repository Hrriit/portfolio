---
name: relief-card
description: Turn a picture into a relief collector card that lights up under the cursor. Vet the picture, get the relief image and its height, normal and roughness maps from an image model, then light the four maps in WebGL.
---

# Relief card

A picture lit as a surface, not shown as a flat image. Four maps of the same card go into one shader. A small warm lamp follows the cursor, so gold, relief and fur only shine where the lamp is. The card leans toward the lamp and its shadow moves the other way.

## 1. Check the picture

1. **Shiny parts**: a few clear things that can reflect, such as metal edges, a frame, jewellery, gems or enamel.
2. **Volume**: soft shading and clear raised and sunken areas. Flat colour makes a flat relief.
3. **Outline**: the subject is complete and stands out from the background. Any aspect ratio works.
4. **Light**: no strong highlights, hard shadows or backlight. They fight the moving lamp. A dark background helps.

If the picture fails, keep it as it is and add only a metal card frame.

## 2. Prompt for the image model

Attach the picture, then paste:

> You are a visual consultant for light-chasing relief cards. Keep the subject's face and texture exactly as they are [and add a small bow tie]. Say whether the picture suits a WebGL relief card lit by a moving lamp, checking: shiny parts, volume, outline, and light. Answer with a verdict (suitable / needs changes / unsuitable), a short reason for each check, and the three most important changes. If changes are needed, write an image-to-image prompt that keeps the subject, face, composition and any text; turns only the outlines and ornaments that should shine into metal; uses a few fitting materials (metal, enamel, lacquer, ceramic or gems), not all of them; adds relief depth and soft shading; and avoids strong highlights, hard shadows and backlight. Keep it brief. Then generate four images of the same size: the relief picture, a normal map, a height map and a roughness map.

## 3. The four maps

| Map | Tells the shader | Convention |
|---|---|---|
| Colour | what each point looks like | normal RGB |
| Height | how high it sits | white = high |
| Normal | which way it faces | green = up, blue = toward you |
| Roughness | how shiny it is | black = sharp highlight, white = matte |

All four must be the same size and line up pixel for pixel.

## 4. Shader

```
parallax   uv + (height − 0.5) · (lamp − 0.5) · 0.0034 · 4
normal     n = map · 2 − 1;  n.xy × 1.45;  n.z ≥ 0.08;  normalise
lamp       L = normalise(lamp − uv, 0.5);  lamp may sit outside the card (−0.4 … 1.4)
diffuse    clamp(dot(n, L) · 0.8 + 0.2) · 0.62
highlight  pow(dot(n, H), mix(52, 6, rough)) · (1 − rough · 0.85) · 0.46
rim        faint and warm, side light only
colours    lamp (1, 0.92, 0.78);  ambient (0.82, 0.83, 0.88) × 0.56
output     premultiplied alpha;  blend ONE, ONE_MINUS_SRC_ALPHA
```

## 5. The card

- Leans up to 10° toward the lamp (perspective 1000px) and sways ±2° when left alone. Everything eases 0.055 per frame in one animation loop.
- Its shadow is a blurred copy of the picture that moves away from the lamp, growing softer and fainter as it goes.
- Rounded corners are cut in the shader.
- Works with mouse and touch. Reduced motion turns off parallax and sway. Pixel ratio is capped at 1.5.
- Without WebGL, or if a map fails to load, the still picture stays.
- Chrome blocks local image files in WebGL, so ship the maps as data: URLs too if the page will be opened by double-click.

Based on the relief-card tutorial by Zomo (Douyin). Built for harrietxu.com, AI Lab.
