---
"ledger-live-desktop": patch
---

Make the Baanx card env vars reach packaged desktop builds. `CARD_BAANX_API_URL`, `CARD_BAANX_CLIENT_KEY`, `CARD_BAANX_HOSTED_UI` and `CARD_OAUTH_REDIRECT_URI` are read through `@shared/env` (`getEnv`/`useEnv`), which DefinePlugin cannot reach, so setting them on a CI build step had no effect on the artifact and the Card login always used the `shared/env` defaults. The renderer build now bakes them into a `__BUILD_ENVS__` object that `renderer/env` merges into `process.env` at boot, behind any real runtime value, from where the existing boot-time seeding pushes them into the env store.
