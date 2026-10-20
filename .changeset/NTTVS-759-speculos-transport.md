---
"@ledgerhq/wallet-cli": minor
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-desktop": patch
---

Run device commands against Speculos when `SPECULOS_API_PORT` is set, with stable exit codes when the emulator is unreachable. `live-dmk-shared` now owns the Speculos target parsing and transport factory shared with `live-dmk-desktop`
