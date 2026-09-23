---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent enroll/complete/list/show command group

Every command that reads and writes `session.yaml` (enroll/complete/reset/account discover/ring
init/destroy/encrypt/decrypt) now serializes through one real cross-process file lock, closing a
concurrent-write corruption window. `account discover` reconciles the labels it prints against the
one the locked merge actually assigns, and a malformed `agentIntentProfiles` entry now survives a
later `write()` instead of being silently dropped and orphaning its OS-keychain secret.
