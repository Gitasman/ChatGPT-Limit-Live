# Changelog

## 1.2.0 — 2026-10-17

- Replace the floating card with a circular remaining-allowance meter.
- Drag from any free part of the circle or pill; keep buttons and keyboard controls usable.
- Add an immediately visible 96–240 px circle-size slider to the popup, with old-size migration.
- Update circle text and SVG attributes in place; coalesce pointer movement by animation frame and throttle generation-state DOM checks.
- Avoid unchanged toolbar repaint calls and serialize settings writes to prevent rapid-edit data loss.
- Preserve modes, themes, account isolation, polling, stale/error states and safe storage behavior.
- First publication to this repository, with a versioned ZIP and SHA-256 checksum in downloads/.
- Validation: 73 automated cases and syntax checks. New UI not target-verified in Chrome here.

## 1.1.0 — 2026-10-17

- Shared widget/popup design, persisted bounded dragging, panel/pill/icon-only modes.
- Per-tab and selected-source toolbar percentages, lifecycle-safe session snapshots and freshness checks.

## 1.0.0 — 2026-10-17

- Automatic server-backed Work/Codex allowance, duration-aware windows and account/workspace isolation.
