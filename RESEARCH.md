# Research and implementation notes — 2026-10-17

## Existing implementations inspected

1. https://github.com/nvidiarogforce-art/chatgpt-usage-limits-tracker
   - MIT, Copyright 2026 Nizomiddin.
   - Inspected content.js (blob 14527dbe4ba2a3fc552e0700c9f24b2f9a7b2cca), background.js and LICENSE through the connected GitHub reader.
   - Uses /api/auth/session and /backend-api/wham/usage. Already polls from content.js every 45 seconds, so not every existing project requires manual refresh.
   - content.js assigns primary_window to a fixed five-hour structure and secondary_window to weekly. Defaults absent used_percent to zero. Its initial widget state contains example percentages. These patterns are unsuitable for this task's weekly-only and account-isolation requirements.
2. https://github.com/arkenapps/ArkenLimitMonitor-ChatGPT
   - MIT, Copyright 2026 Arken Apps.
   - Inspected main tree 93a838b8766f1349a61bdcee87ce14b55a274ed5; extension/content.js, extension/usage-parser.js, LICENSE.
   - Uses the same authenticated usage endpoint; supports automatic polling, normalization, settings and explicit stale/error states. Shows that session-backed read-only quota requests are an established integration approach.
3. https://chromewebstore.google.com/detail/gpt-meter-%E2%80%94-chatgpt-usage/ajjafikjekdalmagmofjeljndjbpoihd
   - Store description advertises live toolbar meters, Business support and EN/RU. Store claims are not independent verification of behavior or privacy. Its source was not inspected and code was not reused.

The user's installed extension was not supplied, so no conclusion identifies its exact bug. The primary/secondary issue above is a concrete issue in the inspected tracker, not a claim about the user's unidentified extension.

## Official references

- https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex
  Work/Codex share included allowance; applicable windows depend on plan. Ordinary Chat allowances can be separate. The supported UI is Settings → Usage.
- https://help.openai.com/en/articles/11391654-chatgpt-business-release-notes
  Business Premium seats have no five-hour usage limit; do not equate all Business seats with the same limits.
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
  Isolated scripts, MAIN-world script declarations and origin-specific matching.
- https://developer.chrome.com/docs/extensions/reference/api/storage
  Local extension storage and permission.

## Decision

The key integration was established by reading existing working-source patterns, rather than inventing an endpoint or counting prompts. A compact original implementation was selected instead of inheriting either complete UI: this avoids local quota estimates, sample percentages, fixed slot-to-period assumptions, and globally shared current-account state. No third-party source files or assets are redistributed. Endpoint names, response schema and standard session/header patterns are interoperability facts, not a copied codebase.

## Data flow

The MAIN bridge reports only account-context hints and activity. Treat it as an untrusted hint source, never a provider of quotas or tokens. It cannot choose an arbitrary destination URL or issue privileged extension commands. A compromised first-party page could spoof activity/context hints and affect availability; the page already owns that session. The isolated script fetches the session, uses a session account ID or token account claim when no observed workspace header exists, fetches usage with that account header, and rechecks session identity before applying the result. Tokens are never bridged, stored or logged.

User/workspace keys are hashed before entering the bounded local cache. Startup does not display cache until a live session identity has been established. A short cache helps coordinate same-account tabs; identity invalidation prevents applying a former context's response to the new context. Appearance reset touches only appearance fields.

## Limits of evidence

The live endpoint was not queried with the user's credentials. Session schema, endpoint access, native request-header conventions, browser policy, UI integration and actual quota matching still require target validation. Request/session events are observed through fetch, not XHR or WebSocket. A context change not observed through fetch is picked up by later session checks when represented there; otherwise opening the profile/workspace view or reloading is the recovery path. Background tab throttling and server lag make a strict real-time guarantee inappropriate.

The extension never purchases resets, sends messages, modifies workspaces, or sends prompts. All its network operations are allowlisted same-origin GET requests.
