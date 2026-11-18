---
"@ledgerhq/wallet-cli": minor
---

`agent-intent enroll` warns when the state dir is on temporary storage (`/tmp`, the OS temp dir, `/dev/shm`, `$XDG_RUNTIME_DIR`), where a restart would wipe the agent's profile
