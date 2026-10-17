# ChatGPT Limit Live

A small Chrome extension that shows your remaining **Work / Codex** allowance on ChatGPT — automatically, with account-aware server data.

**[Download v1.5.0 ZIP](https://github.com/Gitasman/ChatGPT-Limit-Live/raw/refs/heads/main/downloads/ChatGPT-Limit-Live-v1.5.0.zip)** · [Русская инструкция](README.ru.md) · [Version history](CHANGELOG.md)

## What it does

- A **50 px** floating circle with only a large percentage. The arc follows its outer edge; the default arc is bright and 5 px wide, with a visible track, medium-weight percentage and soft shadow. Weekly allowance is preferred when present.
- Drag anywhere on the circle or compact line. Visibility is controlled only from the toolbar popup; there are no page hide buttons. The widget stays within the visible viewport and remembers its position.
- Set an exact **32–150 px** diameter using the slider or number field directly in the toolbar popup.
- Hover or focus the circle for a larger, readable tooltip with windows, remaining allowance, reset countdowns/dates and freshness. Text size (12–20 px) and width (240–420 px) are configurable. It stays open while hovered and can be dismissed with Escape.
- Set independent colors for the percentage, arc, circle, pill, tooltip and alerts using an inline editor with swatches, RGB sliders, HEX and an optional eyedropper. Complete HEX values save without blur; Done or Escape closes the editor and flushes pending edits. Each color can return to its default independently. Settings also expose arc width, number size/weight/decimals, background opacity, caps, track, shadow, tooltip delay and polling interval.
- Choose **Circle / Pill / Icon only**. Hiding the page widget keeps monitoring active. Pin the extension to see the percentage on Chrome's toolbar.
- Automatic refresh on page load, foreground/focus, detected activity and generation completion, plus configurable 30–300 second foreground polling. Hidden tabs poll no faster than every 120 seconds or the longer configured interval, subject to Chrome suspension/throttling.
- Detects account/workspace changes, clears old percentages and rejects late responses from the previous context.
- Labels actual server windows by duration. A weekly-only account does not get a fabricated five-hour meter.
- English by default, with English / Russian / Browser language choices in Settings → General. System/light/dark themes, keyboard movement and reduced-motion support.

## Install

1. Download the **versioned ZIP above** and extract it into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then the archive's **extension** subfolder containing `manifest.json`.
4. Reload existing ChatGPT tabs once.
5. Pin **ChatGPT Limit Live** using Chrome's puzzle menu.

To update an existing installation, replace files inside the **same extension directory**, reload its card at `chrome://extensions`, then reload ChatGPT tabs. Do not remove the extension if you want to keep preferences. The download includes the complete source and tests; no build step is required.

## Use

Drag the circle from any free area. Hide it via the toolbar popup → Overview → **Icon only**; restore it with **Circle**. There are no close buttons on the circle or pill. The circle prefers the weekly window; window/reset details live in the hover tooltip, while the popup also lists additional pools.

The 400 px toolbar popup has **Overview** and **Settings** tabs. Overview keeps usage, mode and exact circle sizing together. Settings uses grouped sections and paired fields for General, Circle and numbers, Colors, Hover details and Settings backup. Tab navigation works with arrow keys/Home/End. The selected section and scroll position survive language changes. Neutral, darker ChatGPT-style colors are the default for both the popup and the widget; light/system themes and dark/light presets are available. Custom colors are independent overrides; color alerts are off unless enabled. Appearance changes are local to this browser. Older standard 90 px and 148 px sizes migrate to 50 px only from their original schema; current custom sizes are preserved within 32–150 px. The former standard 3 px arc and 600 weight migrate to 5 px and 500; old off-by-default track/shadow become enabled. Other manual colors and geometry remain. New-version explicit off states are preserved. Thick arcs are limited relative to small circles so the percentage retains room. Arrow keys move the focused widget, Shift increases the step, and Home docks it to the default corner. In pill mode, click or press Enter to return to the circle. Docking preserves monitoring settings and usage data. Appearance reset restores the new dark defaults while preserving language, mode, placement, polling and usage data. Reset colors changes only color overrides.

The toolbar badge rounds down to a whole percent; exact decimals appear in the popup/tooltip. Less than 1% is `<1%`, account checking is `…`, stale data is `?`, unavailable is `—`. Other sites show the last selected ChatGPT tab's indicator; ChatGPT tabs keep their own state. A hidden tab for another account cannot replace the selected source.

## Export and import preferences

Open **Settings → Settings backup**. **Export** downloads `ChatGPT-Limit-Live-settings-v1.5.0.json`, including all appearance, tooltip, language, polling, display-mode and normalized-position preferences. Pending valid color/size changes are flushed first. No usage, tokens, account IDs or conversations enter the backup.

**Import** opens a local JSON chooser. Format/schema, field names, types, bounds, colors and size (64 KiB maximum) are checked before any preferences change. The whole valid configuration is then applied and saved; a storage failure restores the previous configuration. **Undo import** is available until the next manual preference change, so it cannot discard later edits. Appearance reset preserves language and monitoring; it is separate from importing an entire backup.

## Available banked resets

The popup and hover details show the server-provided `rate_limit_reset_credits.available_count`, independently from the next automatic reset time. Missing or malformed data is shown as unavailable, never as zero. When the count is positive, the read-only `/backend-api/wham/rate-limit-reset-credits` endpoint supplies available-reset titles and expiration dates. Details are account-scoped and cached for five minutes, with a three-second timeout; an unavailable details endpoint does not hide the percentage or count. No extra request is made for a missing or zero count.

**View in ChatGPT** opens ChatGPT’s official usage page, where the user selects the intended account/workspace, reviews expiration and confirms application. The extension does not consume resets or perform purchases. Banked promotional resets and paid instant resets have different eligibility and effects; see the official sources in [Research notes](RESEARCH.md). Actual reset availability and activation in the user’s live account are not verified here.

## Accuracy and privacy

This reads the internal `/backend-api/wham/usage` endpoint, **not a prompt counter or token estimate**. It reports shared Work/Codex allowance; it does not promise coverage of every ordinary ChatGPT conversation, image, or feature limit. Percentages are server snapshots, with polling/cache/reporting delay — not a guaranteed real-time feed. The internal endpoint may change and require an update. An open, running ChatGPT tab is required for new data.

Permissions: `storage` and `alarms`; page access only on `https://chatgpt.com/*`. No external backend, telemetry, API key or payment. The freshness alarm makes no network requests.

Tokens stay in isolated content-script memory and are used only for allowlisted ChatGPT GET requests. The page bridge reads request URL/method and account-context headers, never Authorization headers, prompts, request bodies or response streams. Original fetch promises and streams are preserved.

Local storage contains preferences and at most eight allowlisted usage snapshots under hashes of user/workspace keys. No saved tokens, emails, raw account/user IDs or full API payloads. Old cache entries are pruned on later writes. Hashes are not encryption. Session-only toolbar snapshots survive worker restarts, not browser restarts.

## Efficiency and checks

No third-party runtime dependencies or build framework. Cross-tab request locking and a short account-scoped cache reduce duplicate usage calls. UI text/attributes update in place, pointer moves are coalesced by animation frame, dragging saves only on release, stream-related DOM checks are throttled, and unchanged toolbar values are not repainted. Size changes and preference writes are coalesced/serialized; rapid changes preserve earlier edits. Error retries back off and respect Retry-After.

With Node.js 20+:

```sh
npm test
npm run check
python3 package.py
```

**129 automated cases passed** for server parsing, account races, polling/errors, ring math, size migration, color validation/contrast, hover timing/dismissal, manual geometry, inline color autosave/flush/error recovery, reset-credit parsing/cache/account isolation, mode changes, drag boundaries/frame coalescing, preference persistence, toolbar lifecycle, popup controls, live language changes, settings backup validation/round trips/import rollback/undo and privacy boundaries. Chrome APIs, DOM and server responses are mocked in integration tests. The redesigned circle, tooltip and settings have **not** been visually or interactively verified in a real Chrome runtime here; compare it with ChatGPT Settings → Usage after installation.

`package.py` creates a deterministic versioned ZIP and SHA-256 file in `downloads/`. It excludes existing downloads, repository metadata, caches and environment files. [Research notes](RESEARCH.md) describe the inspected alternatives and integration basis.

Unofficial. Not affiliated with or endorsed by OpenAI. MIT license.
