---
id: "0008"
title: "Ultra Energetic Dashboard Redesign"
stage: green
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: 003-ai-agent-interface
branch: 003-ai-agent-interface
user: Jannat Osmani
command: design/mockup
labels: ["design","dark-mode","light-mode","animation","typography","standalone-html","cinzel","rajdhani"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - taskflow-dashboard.html
tests:
  - "Dark mode renders with #03030a background, gold accents, aurora glow"
  - "Light mode renders with #faf7f0 parchment background, sidebar stays #1a1a2e"
  - "Theme toggle animates spin, persists to localStorage"
  - "Stat numbers count up from 0 on page load (rAF ease-out cubic)"
  - "All cards stagger in with cardIn animation (0/100/200/300ms delays)"
  - "Logo pulses glow animation infinitely"
  - "Sidebar scan line animates across top"
  - "Grid background drifts upward slowly"
  - "Empty state icon floats"
  - "New Task button shimmer on hover"
  - "Progress rings animate from 0% to target values"
---

## Prompt

Redesign my TaskFlow todo app dashboard to look ULTRA ENERGETIC and visually
stunning in BOTH light mode and dark mode. Every element must look incredible
in both themes — not just tolerable, but jaw-dropping in each.

[Full spec included: Cinzel Decorative + Rajdhani fonts, dark/light mode tokens,
special effects for each mode, shared components spec, animations master list,
toggle behavior spec — single self-contained HTML file, no external deps except Google Fonts]

## Response snapshot

Delivered `taskflow-dashboard.html` — a fully self-contained HTML/CSS/JS file implementing:

**Typography:** Cinzel Decorative (logo, headings, nav, stat labels, section titles) +
Rajdhani (body, numbers, descriptions). Logo wordmark: gold gradient, letter-spacing 2px.

**Dark mode (#03030a):** Near-void black bg, gold `#c9a84c` primary accent, animated grid
drift background, radial aurora (gold top, cyan right, red left), logo pulse glow, sidebar
scan line, stat card shimmer + stagger + count-up, gold left-bar nav active state,
`btnPulse` animation on New Task button.

**Light mode (#faf7f0):** Parchment white, sidebar stays `#1a1a2e` (dark navy), diamond
repeating-gradient overlay on content, crisp white cards with warm shadows, deep gold
`#b8860b` accents. Aurora adapts to muted warm tones.

**CSS architecture:** `:root` for dark tokens, `html[data-theme="light"]` (specificity 0,1,1)
overrides for light tokens. All color/shadow changes transition over `var(--t) = 0.4s ease`.

**Animations (10 keyframes):**
1. `gridDrift` — 20s linear infinite translateY(-80px)
2. `logoPulse` — 3.5s scale 1→1.06 + box-shadow grow
3. `scanLine` — 5s ease-in-out, slides across sidebar top
4. `cardIn` — 0.45s ease, opacity 0→1 + translateY 22px→0
5. `float` — 3.5s ease-in-out, translateY 0→-10px (empty state icon, streak emoji)
6. `shimmer` — 0.55–0.7s, ::after slides across on hover (cards + button)
7. `btnPulse` — 2.8s, box-shadow pulsing glow (dark mode only)
8. `toggleSpin` — 0.45s rotate 0→360 + scale 1→1.35→1
9. `navSweep` — translateX -100%→120% on nav hover
10. `auroraPulse` — 7s opacity 0.45→0.72

**JS:** countUp() via rAF with ease-out cubic; animateRings() for SVG progress rings;
buildWeekChart(); setGreeting(); theme toggle with localStorage persistence;
/ keyboard shortcut to focus search; add task demo via prompt().

## Outcome

- ✅ Impact: Stunning standalone HTML mockup covering all 10 animations, both themes fully, sidebar always dark, Google Fonts CDN.
- 🧪 Tests: Opened in browser — dark/light toggle, count-up, animations all verified.
- 📁 Files: 1 file created (taskflow-dashboard.html, ~650 lines)
- 🔁 Next prompts: Integrate these design tokens/components into the actual Next.js frontend
- 🧠 Reflection: `html[data-theme="light"]` (specificity 0,1,1) reliably overrides `:root` (0,1,0) — cleaner than class-based approach for data-attribute theming.

## Evaluation notes (flywheel)

- Failure modes observed: None — single-file approach avoids import/hydration issues
- Graders run and results (PASS/FAIL): Browser visual check — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Port design tokens to globals.css + update Next.js components
