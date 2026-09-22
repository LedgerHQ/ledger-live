---
"ledger-live-desktop": patch
---

Carry every Baanx card env var into the packaged build. `CARD_BAANX_US_APP_ID`, `CARD_BAANX_LOGIN_MANIFEST_ID` and `CARD_BAANX_HOSTED_MANIFEST_ID` join `BUILD_ENV_NAMES`, so a build step that sets them reaches the app.
