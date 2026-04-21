# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classic minesweeper game built with vanilla JavaScript ES6 modules. Mobile-first PWA with Android APK builds via Capacitor. Uses a 3-layer architecture separating game logic from platform-specific implementations.


## Octile Universe Context (Important)

This project is a **free entry game** within the Octile Universe.

Its purpose is NOT to be a fully-fledged product, but to:
- introduce logical, calm puzzle thinking
- act as a low-friction gateway to Octile
- respect player intelligence without aggressive engagement mechanics

This means:

✅ The game should feel complete enough to enjoy  
❌ but intentionally NOT as deep, long-term, or feature-rich as Octile

Any changes should reinforce Octile as the **primary destination for depth and replayability**.

Any new UI text added must be reviewed against the “Calm, restrained tone” rule.
Exclamation marks are generally discouraged across the Octile Universe.


## Explicit Non-Goals (Do NOT add)

The following are intentionally avoided in this project:

- Daily / weekly challenges
- Long-term progression systems
- Meta unlocks or collectibles
- Account systems or cross-session achievements
- Competitive or time-pressure mechanics
- Over-celebratory feedback or hype-driven UI

If a feature would make this game feel like a standalone flagship product,
it likely does NOT belong here.

## UI / Tone Alignment (Octile Universe)

All UI and copy changes must follow Octile Universe guidelines:

Tone:
- calm
- restrained
- respectful
- non-marketing
- non-judgmental

Avoid:
- exclamation-heavy copy
- praise-focused messaging ("Amazing!", "You're a genius!")
- urgency or reward-pressure language

Prefer:
- neutral statements
- reflective feedback
- subtle encouragement

## Cross-Promotion Rules (Free Game → Octile)

This game may reference Octile only in a **soft, non-intrusive way**.

Rules:
- Show at most ONE cross-promotion entry point
- Only trigger after a satisfaction moment (e.g. game completion)
- Never interrupt active gameplay
- Treat Octile as a natural next step, not a call-to-action

Example allowed phrasing:
- "Looking for a deeper challenge?"
- "Octile explores this style of puzzle further."

The goal is awareness, not conversion pressure.

## Development Commands

### Running & Testing
```bash
# Local development server
npm run dev                  # Starts Python HTTP server on :8000

# Run unit tests
npm test                     # Runs all core/**/*.test.js files

# Build web assets
npm run build                # Outputs to www/ directory
```

### Android Development
```bash
# Prepare Android build (build + sync to android/)
npm run android:prepare

# Open in Android Studio
npm run android:open

# Build debug APK
npm run android:build        # Requires Java 17
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Build release APK (needs signing config)
npm run android:release
```

**Java version requirement:** Android builds require Java 17 (not 21). If you get Java errors, prefix commands:
```bash
JAVA_HOME=$(/usr/libexec/java_home -v 17) ./gradlew assembleDebug
```

### Icon Generation
```bash
# Regenerate Android launcher icons from favicon.svg
node generate-icons.js       # Uses sharp to create all density buckets
```

## Architecture

### 3-Layer Design

**1. Core Layer (`core/`)** - Pure game logic, zero UI dependencies
- `constants.js` - Game config, difficulty presets, SeededRandom class
- `cell.js` - Cell data structure and state transitions
- `board.js` - **CRITICAL FILE** - Mine placement, flood fill, win detection
- `game.js` - Lifecycle management, timer, storage adapter pattern
- `events.js` - EventBus for decoupled communication

**2. Platform Abstraction (`platform/`)** - Interface contracts
- `IRenderer.js`, `IInput.js`, `IAudio.js` - Platform-agnostic interfaces
- Makes core testable and portable to other platforms (native, canvas, etc.)

**3. Platform Implementation (`platforms/web-dom/`)** - Web-specific code
- `renderer.js` - **CRITICAL FILE** - DOM manipulation, performance-optimized
- `input.js` - **CRITICAL FILE** - Pointer Events with ghost click prevention
- `styles.css` - Mobile-first responsive design
- `audio.js` - Placeholder for future sound effects

### Event-Driven Communication

All layers communicate via EventBus. Key events:
- `cell:clicked`, `cell:rightclicked` - Input → Game
- `game:started`, `game:won`, `game:lost` - Game → Renderer
- `cell:revealed`, `cell:flagged` - Game → Renderer
- `timer:tick`, `mines:updated` - Game → Renderer

## Critical Implementation Details

### 1. First-Click Safety (board.js)

Mines are placed **AFTER** first click, not during initialization:
- Safe zone = clicked cell + all 8 neighbors (up to 9 cells)
- Ensures first click never hits mine AND usually opens an area
- **Guard flag:** `this.initialized` prevents duplicate mine placement

```javascript
// WRONG: Placing mines in constructor
constructor() { this.initializeMines(); }

// RIGHT: Lazy initialization on first reveal
reveal(x, y) {
  if (this.firstClick) {
    this.initializeMines(x, y); // Safe zone around (x, y)
  }
}
```

### 2. Flood Fill Algorithm (board.js)

BFS-based reveal with critical protections:
- **Never reveal flagged cells** - `if (cell.state === FLAGGED) continue;`
- Uses `visited` Set to prevent infinite loops
- Stops expansion at numbered cells (adjacentMines > 0)
- Reveals connected empty areas (adjacentMines === 0)

### 3. Performance-Optimized Rendering (renderer.js)

**DO NOT re-render entire board on every change:**
- `renderBoard()` - Called once on game start, creates 81 cell elements
- `updateCell(cell)` - Called for individual cell changes, O(1) lookup via Map
- Stores cell DOM elements: `this.cellElements.set(cell.id, element)`

This prevents mobile lag during flood fill (which may reveal 20+ cells).

### 4. Mobile Touch Input (input.js)

**Uses Pointer Events**, not Touch Events:
- Unified API for mouse/touch/pen
- Tracks `pointerId` to prevent multi-touch interference
- **Long-press threshold: 300ms** (optimized for easy flagging on mobile)
- **Movement tolerance: 20px** (forgives hand tremor, cancels on scroll)

**Ghost click prevention (iOS Safari):**
- Capture-phase click handler blocks synthesized clicks
- `preventNextClick` flag set when long-press triggers
- `e.preventDefault()` on touch pointerdown to stop browser interference
- `touch-action: none` on board element

**Visual feedback:**
- Cell turns gold (`.pressing` class) during long-press
- 50ms haptic vibration on successful flag

### 5. Difficulty Restrictions

**Mobile (< 768px width) shows Easy only:**
- Medium/Hard cause tiny cells and horizontal scrolling
- `app.js` filters difficulty options and auto-switches on resize
- Best times stored per-difficulty: `minesweeper-best-time-EASY`

### 6. Build Output Convention

**CRITICAL: Always output to `www/` directory**
- Capacitor expects `webDir: "www"` (in capacitor.config.json)
- GitHub Actions workflows expect `www/`
- Do not change to `dist/` or `build/` - breaks CI/CD

## Testing Strategy

Unit tests cover:
- **Board tests (MOST IMPORTANT):**
  - First-click safety (clicked cell + 8 neighbors never have mines)
  - Mine count validation (exactly 10 mines placed)
  - Adjacent mines calculation accuracy
  - Flood fill correctness (empty areas expand, numbers stop)
  - Flagged cells never revealed

- **Game tests:**
  - Timer starts on first reveal only (not on init)
  - Timer stops on win/loss
  - Best time persistence

- **Cell tests:**
  - State transition validity (covered → revealed/flagged)

**Manual testing checklist for mobile:**
- Long-press flags cell (gold glow → vibration → flag appears)
- Flag persists after finger release (no ghost click)
- Scroll doesn't trigger accidental flags
- Works on both iOS Safari and Android Chrome

## Common Pitfalls

### Android Icon Updates
After modifying `favicon.svg` or `generate-icons.js`:
```bash
node generate-icons.js       # Regenerate all density buckets
npm run android:prepare      # Sync to android/
cd android && ./gradlew clean  # Clean build cache
```

### Service Worker Caching
PWA caches aggressively. During development:
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Or update `CACHE_NAME` in `sw.js` to bust cache

### Long-Press Not Working
If flagging is too hard on mobile:
- Check `longPressThreshold` (currently 300ms)
- Check `moveCancelPx` (currently 20px)
- Verify `.pressing` visual feedback appears
- Test on real device, not just browser DevTools mobile emulation

### Android Build Java Version
Error: `invalid source release: 21`
- Project requires Java 17, not 21
- Export correct JAVA_HOME or use inline:
  ```bash
  JAVA_HOME=$(/usr/libexec/java_home -v 17) ./gradlew assembleDebug
  ```

## Deployment

**GitHub Pages:** Push to `main` branch auto-deploys via `.github/workflows/deploy-github-pages.yml`

**Android Release:** Tag with `git tag v1.0.0 && git push --tags` triggers `.github/workflows/android-build.yml`

## Key Files Priority

When making changes, these files have the highest impact:

1. **`core/board.js`** - Mine placement, flood fill (most complex logic)
2. **`platforms/web-dom/input.js`** - Touch handling (most fragile on mobile)
3. **`platforms/web-dom/renderer.js`** - Performance-critical rendering
4. **`app.js`** - Event wiring, difficulty management
5. **`core/game.js`** - Timer, storage, lifecycle

Read these files first before making changes to understand constraints and design decisions.
