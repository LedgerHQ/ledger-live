---
"@ledgerhq/coin-tester-stacks": patch
---

fix: pin the devnet images and rust toolchain, and cache the patched clarinet binary in CI

`hirosystems/stacks-blockchain-api` and `postgres` defaulted to the floating `latest` and
`alpine` tags at the pinned clarinet commit, so an upstream push could break every run with no
change on our side, as `latest` moving to 9.3.0 did on 2026-09-15. Both are now pinned by tag and
digest to the images the last green runs pulled, and the clarinet build uses a pinned rust base
image and dated nightly. CI now caches `.clarinet-cache`, keyed on `docker/clarinet/**`, instead
of spending ~13 minutes rebuilding clarinet from source on every run.
