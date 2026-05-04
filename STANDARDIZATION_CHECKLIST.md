# Standardization Checklist - Minesweeper

## Phase 1: Foundation
- [x] config.json created with DEFAULT_CONFIG fallback in app.js
- [x] UUID system with game_id prefix (`octile:mine:*_uuid`)
- [x] i18n system created from scratch (en/zh support)
- [x] localStorage keys use `octile:mine:{feature}:{name}` pattern

## Phase 2: Core Infrastructure
- [x] Health check with offline guard (`console.debug`, no flood)
- [x] OTA system (HTML banner, CSS, script)
- [x] SW disabled on file:// protocol
- [x] API/Score submission with `score_semantics` field
- [x] Queue key: `octile:mine:api_queue`

## Phase 3: User-Facing
- [x] Help modal created from scratch (i18n applied)
- [x] Privacy policy (UUID, score, AdMob, feedback mentions)
- [x] Feedback form (screenshot optional, i18n)
- [x] Help modal links to feedback + privacy
- [x] Contact mechanism (mailto in help/footer with Android fallback)

## Phase 4: Monetization & Branding
- [x] AdMob integration (banner-only v1.0, split flags)
- [x] SessionManager with game_id prefix (`octile:mine:admob_session`)
- [x] AdMobManager with game_id metrics (`octile:mine:admob_metrics`)
- [x] Octile branding (footer + win modal cross-promo)

## Testing
- [ ] Config load failure → defaults work
- [ ] Offline → online queue flush
- [ ] OTA update → no SW cache conflict
- [ ] Score submission includes `score_semantics`, `app_version`, `build_channel`
- [ ] i18n complete (no English hardcoded strings)
- [ ] localStorage keys don't collide with other games
- [ ] AdMob banner-only (no interstitial v1.0)
- [ ] Feature flags tested (enable/disable each)
- [ ] Android-only checks (AdMob, OTA, file://)

## Critical Gates (MUST PASS)
- [x] **Feature flag semantics consistent**: All use `=== true` (not `!== false` or truthy)
- [x] **Health independent**: NOT tied to `score_submission` flag
- [x] **Contact implemented**: mailto in help/footer + fallback text + i18n keys present
- [x] **Force update blocks input**: Full-screen overlay + `pointer-events: none` on game
- [x] **Force update priority**: Checked BEFORE dismiss flag (dismiss never blocks force)
- [x] **Mine grep gate**: `grep -r "textContent = ['\"]" mine/` returns ZERO hardcoded UI strings
- [x] **UUID overwrite rule**: captureCookieUUID only sets if BOTH keys empty (never overwrites)
- [x] **Score client_type**: All submissions include `client_type: 'octile-free'`
- [x] **AdMob keys game-scoped**: `octile:mine:admob_session`, `octile:mine:admob_metrics`

## Documentation
- [ ] README updated with new features
- [x] version.json created with otaVersionCode
- [x] config.json documented with all feature flags
- [ ] APP_VERSION_CODE auto-inject documented in build script

## Game-Specific Score Format
```json
{
  "game_id": "mine",
  "score_value": completionTime,
  "client_type": "octile-free",
  "game_data": {
    "score_semantics": "lower_is_better",
    "app_version": 1,
    "build_channel": "web",
    "difficulty": "EASY",
    "mines": mineCount,
    "rows": 9,
    "cols": 9
  }
}
```

## Status
**Phase**: Days 8-10 (AdMob + Testing)
**Completion**: 95% (AdMob added, E2E testing pending)
