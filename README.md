# ChatGPT Limit Live

A small Chrome extension that shows your remaining **Work / Codex** allowance on ChatGPT — automatically, with account-aware server data.

**[Download v1.2.0 ZIP](https://github.com/Gitasman/ChatGPT-Limit-Live/raw/refs/heads/main/downloads/ChatGPT-Limit-Live-v1.2.0.zip)** · [Русская инструкция](README.ru.md) · [Version history](CHANGELOG.md)

## What it does

- A circular floating meter with a large percentage and an arc showing **remaining** capacity. Weekly allowance is preferred when present.
- Drag anywhere on the circle or compact line. Controls remain clickable. The widget stays within the visible viewport and remembers its position.
- Set the circle diameter **96–240 px** directly in the toolbar popup. Themes and appearance reset are available under Settings.
- Choose **Circle / Pill / Icon only**. Hiding the page widget keeps monitoring active. Pin the extension to see the percentage on Chrome's toolbar.
- Automatic refresh on page load, foreground/focus, detected activity and generation completion, plus 30/60/120-second foreground polling. Hidden tabs poll every 120 seconds, subject to Chrome suspension/throttling.
- Detects account/workspace changes, clears old percentages and rejects late responses from the previous context.
- Labels actual server windows by duration. A weekly-only account does not get a fabricated five-hour meter.
- Russian UI for Russian Chrome locales; English otherwise. System/light/dark themes, keyboard movement and reduced-motion support.

## Install

1. Download the **versioned ZIP above** and extract it into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then the archive's **extension** subfolder containing `manifest.json`.
4. Reload existing ChatGPT tabs once.
5. Pin **ChatGPT Limit Live** using Chrome's puzzle menu.

To update an existing installation, replace files inside the **same extension directory**, reload its card at `chrome://extensions`, then reload ChatGPT tabs. Do not remove the extension if you want to keep preferences. The download includes the complete source and tests; no build step is required.

## Use

Drag the circle from any free area. The small close control appears on hover/focus and hides the widget. Reopen it via the toolbar popup → **Circle**. The circle prefers the weekly window; the popup lists all returned main windows and additional pools.

The size slider is immediately visible in the popup. Appearance changes are local to this browser. Arrow keys move the focused widget, Shift increases the step, and Home docks it to the default corner. In pill mode, click or press Enter to return to the circle. Docking and appearance reset preserve monitoring settings and usage data.

The toolbar badge rounds down to a whole percent; exact decimals appear in the popup/tooltip. Less than 1% is `<1%`, account checking is `…`, stale data is `?`, unavailable is `—`. Other sites show the last selected ChatGPT tab's indicator; ChatGPT tabs keep their own state. A hidden tab for another account cannot replace the selected source.

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

**73 automated cases passed** for server parsing, account races, polling/errors, ring math, size migration, mode changes, drag boundaries/frame coalescing, preference persistence, toolbar lifecycle, popup controls and privacy boundaries. Chrome APIs, DOM and server responses are mocked in integration tests. The new circular UI has **not** been visually or interactively verified in a real Chrome runtime here; compare it with ChatGPT Settings → Usage after installation.

`package.py` creates a deterministic versioned ZIP and SHA-256 file in `downloads/`. It excludes existing downloads, repository metadata, caches and environment files. [Research notes](RESEARCH.md) describe the inspected alternatives and integration basis.

Unofficial. Not affiliated with or endorsed by OpenAI. MIT license.
