---
"@ledgerhq/coin-celo": minor
"@ledgerhq/live-signer-celo": minor
---

celo: fix add-account failing entirely with `UNKNOWN_ERROR (0x6a15)` on older Celo apps. Scanning now skips a derivation path the installed app does not authorize (celoEvm account index >= 1 on apps < 1.7.0, which return the OS "path not authorized" status word) instead of aborting the whole scan — so accounts on authorized paths are still added. Gated on both the `0x6a15` status word and the installed Celo app version (`< 1.7.0`, read via `getAppConfiguration`), so behavior is unchanged on up-to-date apps.
