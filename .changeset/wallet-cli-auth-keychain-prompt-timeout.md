---
"@ledgerhq/wallet-cli": patch
---

fix(wallet-cli): keep swap quotes authenticated while the keychain dialog is open

The 10 s auth timeout no longer counts the time the macOS keychain dialog waits for the user. Before, answering it slowly sent the quote without a token.
