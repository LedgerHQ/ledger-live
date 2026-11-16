---
"@ledgerhq/wallet-cli": patch
---

`agent-intent enroll` warns when the state dir is on temporary storage (`/tmp`, the OS temp dir, `/dev/shm`), where a restart would wipe the agent's profile
