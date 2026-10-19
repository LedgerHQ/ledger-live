---
"@ledgerhq/wallet-cli": minor
---

Fail `agent-intent enroll` with `keychain_unavailable` when Linux has no Secret Service, and add `--allow-plaintext-key` to store the agent key in a 0600 file after the human agrees. Existing Agent Intent profiles on Linux without a Secret Service (whose key went to the kernel keyring) now fail with `keychain_unavailable` and must be re-enrolled under a new `--profile` id (with `--allow-plaintext-key` only after the human agrees).
