---
"ledger-live-mobile-e2e-tests": minor
"live-mobile": minor
---

Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
`visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
suite previously only proved an element existed in the tree. On the app side, the accounts list
scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.
