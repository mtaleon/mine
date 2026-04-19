# 💣 Minesweeper Game

Classic minesweeper puzzle game built with vanilla JavaScript. Features mobile-first responsive design, PWA support, and Android APK builds.

## 🎮 How to Play

### Rules
- Click/tap a cell to reveal it
- Right-click/long-press to flag a cell as a suspected mine
- Reveal all non-mine cells to win
- Clicking a mine ends the game

### Controls

**Desktop:**
- **Left click**: Reveal cell
- **Right click**: Flag/unflag cell
- **Reset button (🔄)**: Start new game

**Mobile:**
- **Tap**: Reveal cell
- **Long-press (500ms)**: Flag/unflag cell
- **Reset button (🔄)**: Start new game

### Goal
- Find all 10 mines on the 9×9 grid
- Use numbers to deduce mine locations
- Complete the game as fast as possible!

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0
- Python 3 (for dev server)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:8000
```

### Build for Production

```bash
# Build web assets
npm run build

# Output in www/ directory
```

## 📱 Building for Android

### Prerequisites
- Node.js >= 22.0.0
- Android Studio with SDK installed
- JDK 21

### Setup

```bash
# Install dependencies
npm install

# Add Android platform
npx cap add android

# Build and sync
npm run android:prepare
```

### Build APK

```bash
# Debug build
npm run android:build

# Release build (requires signing key)
npm run android:release

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### Open in Android Studio

```bash
npm run android:open
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Tests cover:
# - Core game logic (mine placement, flood fill)
# - Cell state transitions
# - Timer behavior
# - Storage persistence
```

## 🏗️ Architecture

The project follows a 3-layer architecture:

1. **Core layer** (`core/`) - Pure game logic with zero UI dependencies
   - `constants.js` - Game configuration and constants
   - `cell.js` - Cell data structure
   - `board.js` - Board management, mine placement, flood fill
   - `game.js` - Game lifecycle, timer, storage

2. **Platform abstraction** (`platform/`) - Interface contracts
   - `IRenderer.js` - Rendering interface
   - `IInput.js` - Input interface
   - `IAudio.js` - Audio interface

3. **Platform implementation** (`platforms/web-dom/`) - Web-specific code
   - `renderer.js` - DOM rendering
   - `input.js` - Mouse and touch input
   - `audio.js` - Sound effects (future)
   - `styles.css` - Mobile-first styles

## 🎯 Features

- ✅ Classic minesweeper gameplay (9×9 grid, 10 mines)
- ✅ First-click safety (never hit mine on first click)
- ✅ Smart flood fill (reveals connected empty areas)
- ✅ Mobile-first responsive design
- ✅ Touch-optimized (tap to reveal, long-press to flag)
- ✅ Timer and best time tracking
- ✅ PWA support (offline play, installable)
- ✅ Android APK builds via Capacitor
- ✅ Seeded random for reproducible games

## 📦 Project Structure

```
mine/
├── core/                   # Game logic
│   ├── constants.js
│   ├── cell.js
│   ├── board.js
│   ├── game.js
│   ├── events.js
│   └── *.test.js          # Unit tests
├── platform/              # Platform interfaces
├── platforms/web-dom/     # Web implementation
│   ├── renderer.js
│   ├── input.js
│   ├── audio.js
│   └── styles.css
├── .github/workflows/     # CI/CD
│   ├── deploy-github-pages.yml
│   └── android-build.yml
├── android/               # Android project (generated)
├── www/                   # Build output
├── index.html
├── app.js                 # App entry point
├── sw.js                  # Service worker
├── manifest.json          # PWA manifest
└── package.json
```

## 🚀 Deployment

### GitHub Pages

Push to main branch to automatically deploy to GitHub Pages:

```bash
git push origin main
```

Visit: `https://<username>.github.io/mine/`

### Android Release

Tag a release to trigger APK build:

```bash
git tag v1.0.0
git push --tags
```

Download APK from GitHub Releases.

## 🐛 Troubleshooting

### Build fails
- Ensure Node.js >= 22.0.0
- Run `npm ci` for clean install

### Android build fails
- Check JDK 21 is installed
- Ensure Android SDK is properly configured
- Run `npx cap sync android` manually

### Touch input not working
- Check mobile browser compatibility
- Ensure viewport meta tag is present
- Test on actual device (not just emulator)

### Service worker not updating
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check service worker console logs

## 📝 License

MIT

## 🙏 Credits

Built with:
- Vanilla JavaScript (ES6 modules)
- Capacitor for Android builds
- GitHub Actions for CI/CD

Inspired by the classic Microsoft Minesweeper game.
