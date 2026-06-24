---
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

chore(recover): replace protect-simu defaults with protect-prod in protectServices feature flags

`protectServicesDesktop` and `protectServicesMobile` defaulted `protectId` and every templated URI to `protect-simu` — a manifest that was deleted from `manifest-api` along with five other unused entries. With the manifest gone, any client that fell back to the schema defaults (local dev builds without Firebase Remote Config, fresh installs that fail the first remote fetch, integration tests) ended up with deeplinks pointing at a nonexistent manifest, producing broken Recover entry-points for developers.

Switch the schema defaults (and the matching test fixtures) to `protect-prod`. Production behavior is unchanged: prod clients fetch a healthy Firebase payload that already pins `protectId: "protect-prod"`, so the schema default is only used as a safety net in dev / fallback scenarios.

Also drop `"protect-simu"` from the `recoverIdsShowTopBar` / `headerShownIds` allow-lists in `WebRecoverPlayer` (desktop + mobile) — the dev top-bar hint was never going to match a deleted manifest.

The `useReplacedURI` regression test that explicitly asserts the regex still substitutes the legacy `protect-simu` placeholder is intentionally preserved.
