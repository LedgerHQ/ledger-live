# @features/platform-app-update

> [!CAUTION]
> **Status: UNSTABLE** — New package extracted from the desktop updater; API may change.

Integrity checks for desktop app updates.

- `verifySecp256k1Signature` — verifies a DER secp256k1 signature of a message against a PEM public key, without OpenSSL (Electron ships BoringSSL)

Lives here so that `ledger-live-desktop` does not depend on `@noble/curves` directly.
