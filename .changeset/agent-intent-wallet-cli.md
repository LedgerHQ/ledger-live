---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent enroll/list/show command group

`agent-intent enroll` (default environment: production) prints a relay-bound signed enrollment URL,
then blocks until the approval comes back over the encrypted Trustchain relay. The completion is
verified (App-18 token, App-16 permission) before the Trustchain ID and Ledger Sync account access are
saved; on timeout or interruption the profile stays pending. There is no manual completion command.

Every command that reads and writes `session.yaml` (enroll/reset/account discover/ring
init/destroy/encrypt/decrypt) now serializes through one real cross-process file lock, closing a
concurrent-write corruption window. `account discover` reconciles the labels it prints against the
one the locked merge actually assigns, and a malformed `agentIntentProfiles` entry now survives a
later `write()` instead of being silently dropped and orphaning its OS-keychain secret.
