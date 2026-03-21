# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WonderCanvas AI** is an educational web application for children (targeting ~11-year-old girls) that combines an interactive drawing canvas with an AI-powered Socratic tutor ("WonderBot"). The AI uses Google Gemini to engage users through open-ended questions and contextual learning. UI strings are primarily in Spanish.

## Repository Structure

```
frontend/   # React/Vite frontend app
```

## Commands

Run from the `frontend/` directory:

```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

No linting or testing scripts are configured yet.

## Environment Variables

Create a `frontend/.env.local` file with:
```
GEMINI_API_KEY=your_key_here
```

Vite exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Architecture

### Key Data Flow

1. User draws on `CanvasBoard` or types in the chat
2. `App.tsx` captures canvas image via `canvasRef.current.getCanvasImage()` (returns raw base64, no data URL prefix)
3. Image + text sent to `chatWithGemini()` in `services/geminiService.ts`
4. Gemini may invoke the `generate_illustration` function tool → triggers `generateImage()` using Imagen-4.0
5. Generated images are injected back into the canvas via `canvasRef.current.injectImage()`

### Component Responsibilities

- **`frontend/App.tsx`**: Layout, all state (messages, active tool, stroke color), orchestrates canvas ↔ AI interaction
- **`frontend/components/CanvasBoard.tsx`**: HTML5 Canvas with mouse/touch support; exposes imperative API via `useImperativeHandle`:
  - `getCanvasImage()` → base64 string (no prefix)
  - `clearCanvas()` → resets to white
  - `injectImage(base64)` → overlays image with shadow effect
- **`frontend/services/geminiService.ts`**: Gemini 2.5 Flash integration with Socratic system instruction; handles function-calling for illustration generation

### AI Integration

- Model: `gemini-2.5-flash` for conversation; `imagen-4.0` for image generation
- WonderBot persona: cheerful Socratic tutor, responds in Spanish, uses emojis occasionally
- Function tool `generate_illustration` is defined in the service and called by the model when explaining abstract concepts visually

### Styling

Tailwind CSS is loaded via CDN in `index.html` (not installed as a package). Brand palette is pink/magenta. Font is Comic Sans MS for playful aesthetic. Custom scrollbar-hiding CSS is in `index.html`.

### Module Resolution

Libraries (React, React DOM, Lucide, `@google/genai`) are loaded via importmap in `frontend/index.html`, not bundled. Path alias `@/` maps to the `frontend/` directory.
