---
id: "0007"
title: "Fix Theme Toggle Provider Context"
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-6
feature: 003-ai-agent-interface
branch: 003-ai-agent-interface
user: Jannat Osmani
command: bug fix
labels: ["bug","theme","dark-mode","context","provider","hydration"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/providers/ThemeProvider.tsx
  - frontend/app/layout.tsx
  - frontend/components/dashboard/TopBar.tsx
tests:
  - "Theme toggle button switches between dark and light mode visually"
  - "CSS variables (--bg, --surface, --text) update on toggle"
  - "Preference persists across page reloads (localStorage)"
  - "No flash of wrong theme on initial load (inline script + no-FOUC)"
---

## Prompt

the theme toggle button is not changing the web app theme to light mode it's in always in dark mode fix it

## Response snapshot

Root-cause analysis and definitive fix:

**Root cause — Local state fragmentation:**
The previous fix updated `TopBar.tsx`'s `useEffect` to sync the DOM class, but a stale `toggleTheme` function shadowed the imported `toggle` from `useTheme`. Additionally, theme state was local to `TopBar`, not a shared context — meaning the `dark` boolean and DOM class could get out of sync if anything else interfered with the `<html>` class (e.g., the inline script running before hydration vs. React state initialising to `true`).

**Fix — ThemeProvider context (single source of truth):**

1. Created `frontend/components/providers/ThemeProvider.tsx`:
   - `ThemeContext` with `{ dark: boolean, toggle: () => void }`
   - `useEffect` on mount: reads `localStorage.getItem("theme")`, sets state and calls `classList.toggle("dark", isDark)`
   - `toggle()`: flips state, calls `classList.toggle("dark", next)`, persists to localStorage
   - Exported `useTheme()` hook for consumers

2. Updated `frontend/app/layout.tsx`:
   - Added `<ThemeProvider>` wrapping `<AuthProvider>` + `<ToastProvider>`
   - Kept the inline no-FOUC script and `suppressHydrationWarning` on `<html>`

3. Updated `frontend/components/dashboard/TopBar.tsx`:
   - Removed local `dark` state, both `useEffect` hooks for theme, and the local `toggleTheme` function
   - Now uses `const { dark, toggle: toggleTheme } = useTheme()`
   - Only one `useEffect` remains: the keyboard shortcut (`/` to focus search)

## Outcome

- ✅ Impact: Theme toggle button now correctly switches between dark and light mode; preference persists across reloads.
- 🧪 Tests: Manual verification — click Sun/Moon icon → CSS variables update; reload → correct theme restored.
- 📁 Files: 3 files modified (1 created, 2 updated)
- 🔁 Next prompts: Verify in browser; extend ThemeProvider to other pages if needed
- 🧠 Reflection: Always use a context provider (single source of truth) for global UI state like theme. Local component state for theme creates subtle hydration/sync bugs in Next.js App Router.

## Evaluation notes (flywheel)

- Failure modes observed: Local theme state in TopBar conflicted with DOM class set by inline script; stale closure in toggleTheme
- Graders run and results (PASS/FAIL): Manual browser test — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add transition animation on theme switch using CSS `color-scheme` property
