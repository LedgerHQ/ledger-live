---
"ledger-live-desktop": minor
---

Upgrade Electron from v32 to v36

Also:
- Upgrades relevant Electron ecosystem packages
- Replaces CJS with ESM imports in `notarize.js` (given `@electron/notarize` is now ESM only)
- Removes a hack for loading React/Redux devtools (the latest major version of `electron-devtools-installer` fixes the problem that required the hack)
- Replaces `tiny-secp256k1` with `@bitcoinerlab/secp256k1` in `libs/hw-ledger-key-ring-protocol` and `libs/ledgerjs/packages/hw-app-btc` due to failing to build with latest version of Node/Electron
