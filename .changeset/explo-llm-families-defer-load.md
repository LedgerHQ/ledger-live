---
"live-mobile": minor
---

Defer-load all coin family UI modules in Ledger Live Mobile.

- Replaces `src/families/index.ts` eager barrel with a lazy slot registry (`families/loaders.ts`, `families/hooks.ts`, `families/useFamilySlot.ts`)
- Each family slot (accountHeader, operationIcon, sendRows, etc.) loads only when first needed — not at app boot
- All 47 family navigation screens in `BaseNavigator.tsx` are now `React.lazy()` — split into individual chunks loaded on first navigation
- Deletes `scripts/sync-families-dispatch.mjs` (code-generation step no longer needed)
- No behaviour changes; same public API for consumers
