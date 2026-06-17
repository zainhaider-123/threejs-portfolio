# Design

## Theme

Paper diorama — a hand-crafted paper theater, warm light through translucent layers, the curiosity of unfolding something. Not cold, not corporate, not slick. Tactile, inviting, slightly strange in the way real craft always is.

## Color Strategy

**Committed** — the 3D paper diorama carries 30–60% of the visual surface. The UI is restrained, letting the scene breathe. Primary indigo anchors the identity; warm amber accents echo the golden-hour light on paper.

## Palette (OKLCH)

```css
:root {
  /* Brand */
  --color-primary: oklch(0.450 0.150 235);   /* Deep saturated indigo — the seed, anchor of identity */
  --color-accent:  oklch(0.600 0.155 55);     /* Warm amber — golden-hour light on paper */

  /* Surfaces */
  --color-bg:      oklch(1.000 0.000 0);      /* Pure white — lets the 3D scene own the warmth */
  --color-surface: oklch(0.965 0.006 230);     /* Barely-there cool tint — cards, panels */

  /* Text */
  --color-ink:     oklch(0.140 0.020 230);     /* Near-black with seed hue — body text */
  --color-muted:   oklch(0.550 0.020 230);    /* Secondary text — ink pulled toward bg */

  /* 3D Scene */
  --scene-paper:    oklch(0.950 0.010 80);     /* Warm paper white */
  --scene-paper2:   oklch(0.900 0.020 75);     /* Slightly darker paper */
  --scene-shadow:   oklch(0.700 0.020 60);     /* Paper in shadow */
  --scene-outline:  oklch(0.200 0.030 230);    /* Dark indigo outlines */
  --scene-warm:     oklch(0.750 0.120 55);      /* Golden/amber paper accent */
  --scene-cool:     oklch(0.650 0.100 235);    /* Indigo paper accent */
  --scene-sky:      oklch(0.850 0.040 230);    /* Soft blue sky */
  --scene-green:    oklch(0.550 0.100 150);    /* Paper green for foliage */
}
```

### Contrast verification
- ink on bg: L 0.14 on L 1.0 → >15:1 ✓
- muted on bg: L 0.55 on L 1.0 → ~4.6:1 ✓
- primary on bg: L 0.45 on L 1.0 → ~7:1 ✓
- White text on primary: saturated mid-luminance → white text per HK effect ✓
- White text on accent: saturated mid-luminance → white text per HK effect ✓

## Typography

### Font stack

- **Display**: Bricolage (Google Fonts, variable weight 200–800) — warm grotesque with crafted personality. Not geometric, not editorial. Feels like it was made, not generated.
- **Body**: Source Sans 3 (Google Fonts, variable weight) — warm humanist sans, excellent readability, pairs well with Bricolage's quirkiness without competing.

### Scale

Fluid `clamp()` with ≥1.25 ratio between steps:

```css
:root {
  --font-display: 'Bricolage', sans-serif;
  --font-body: 'Source Sans 3', sans-serif;

  --text-xs:   clamp(0.75rem, 0.70rem + 0.25vw, 0.8125rem);
  --text-sm:   clamp(0.875rem, 0.82rem + 0.30vw, 0.9375rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem);
  --text-lg:   clamp(1.125rem, 1.05rem + 0.38vw, 1.25rem);
  --text-xl:   clamp(1.25rem, 1.10rem + 0.75vw, 1.5rem);
  --text-2xl:  clamp(1.5rem, 1.20rem + 1.50vw, 2rem);
  --text-3xl:  clamp(1.875rem, 1.40rem + 2.40vw, 2.75rem);
  --text-4xl:  clamp(2.25rem, 1.50rem + 3.75vw, 4rem);
  --text-hero: clamp(2.75rem, 1.00rem + 7.50vw, 6rem);
}
```

### Hierarchy

- **Hero heading**: `var(--text-hero)`, Bricolage weight 700, `letter-spacing: -0.03em`, `text-wrap: balance`
- **Section headings**: `var(--text-4xl)`, Bricolage weight 600, `letter-spacing: -0.02em`
- **Subheadings**: `var(--text-xl)`, Bricolage weight 500
- **Body**: `var(--text-base)`, Source Sans 3 weight 400, `max-width: 65ch`, `line-height: 1.6`
- **Captions/labels**: `var(--text-sm)`, Source Sans 3 weight 600, `letter-spacing: 0.02em`

## Layout

- Full-viewport hero with 3D scene as background, text overlay centered
- Content sections below with generous vertical spacing (`clamp(6rem, 12vw, 10rem)` between sections)
- Max content width `72ch` for prose, `1200px` for project grids
- Project cards: `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`
- Asymmetric layouts where appropriate — offset headings, staggered grids

## Motion

- **Hero 3D scene**: Mouse parallax on layers, subtle idle animation (gentle sway)
- **Scroll**: GSAP ScrollTrigger for section reveals — fade-up with slight scale, staggered 0.08s
- **Section transitions**: Crossfade, not slide. `ease-out-quart` for all reveals.
- **Reduced motion**: Static scene visible, scroll animations become instant opacity changes
- **Duration**: Reveals 0.6–0.8s, micro-interactions 0.2–0.3s
- **No bounce, no elastic, no layout-property animation**

## Components

### Hero
- Full viewport height, 3D canvas as background
- Name in hero heading, tagline below
- Subtle scroll indicator at bottom
- Text overlay: semi-transparent bg with backdrop-blur for readability

### About
- Brief intro paragraph, personality-driven
- Offset layout: text left-aligned with generous right margin
- Maybe a small 3D paper element as accent

### Projects
- Grid of project cards with hover lift effect
- Each card: project image/preview, title, brief description, tech tags
- Cards have subtle paper texture border/shadow

### Contact
- Clean, minimal section with social links
- Email, GitHub, Twitter/X, LinkedIn
- Simple icon + text layout

### Navigation
- Fixed top nav, transparent over hero, solid bg on scroll
- Logo/name left, nav links right
- Mobile: hamburger menu with paper-fold animation

## 3D Scene Design

### Paper Diorama
A layered paper landscape viewed from the front, like a shadow box or theater set:
- 5–7 layers of paper cutout planes at different z-depths
- Background: soft sky gradient, paper clouds
- Mid-ground: rolling paper hills, paper trees (triangular/conical shapes)
- Foreground: paper grass, small paper flowers
- Warm directional light from upper-right (sunlight through a window)
- Soft ambient fill light
- Dark indigo outlines on all paper shapes (inverted hull or edge detection)
- Mouse movement causes subtle parallax between layers
- Scroll causes gentle camera dolly forward

### Technical approach
- React Three Fiber for React integration
- MeshToonMaterial for cel-shaded paper look
- Inverted hull outlines for paper edge definition
- Custom gradient map for toon shading steps
- GSAP ScrollTrigger for scroll-linked camera movement
- requestAnimationFrame-based mouse parallax

## Anti-patterns (specific to this project)

- No glassmorphism cards over the 3D scene
- No gradient text
- No side-stripe borders on cards
- No numbered section markers (01/02/03)
- No tiny uppercase tracked eyebrows above every section
- No generic dev portfolio aesthetics (dark mode, terminal, monospace)
- No cream/beige background (pure white, warmth comes from the 3D scene)