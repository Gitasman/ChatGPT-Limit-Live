# Changelog

## 1.3.0 — 2026-10-17

- Default to a 90 px dark percentage-only circle; move arc to the outer edge with no default track or shadow.
- Move window/reset/freshness details into a styled, bounded hover/focus tooltip with Escape dismissal and hover persistence.
- Add exact 48–320 px sizing, independent validated colors/HEX inputs, color presets, and separate color reset.
- Add manual arc width/caps, numeric scale/weight/decimals, background opacity, track/shadow/alerts, tooltip timing and 30–300 second polling.
- Replace the malformed settings glyph with a symmetric SVG cog.
- Migrate the former 148 px default while preserving other custom diameters; appearance reset preserves mode, placement, monitoring and usage.
- Render tooltip content only while open, retain in-place UI updates and coalesced pointer movement.
- Respect longer user-selected polling intervals in hidden tabs.
- Validation: 92 automated cases plus syntax checks. The redesigned UI is not target-verified in Chrome here.

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
