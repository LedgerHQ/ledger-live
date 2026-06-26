---
"@ledgerhq/live-common": minor
---

Extract a headless XState machine + flow planner for the wallet-side
`custom.swap` device-intent flow into
`@ledgerhq/live-common/wallet-api/Exchange/swapFlow`. The machine ports
the swap-live-app `_stepMachine` step vocabulary (`approve_token` ->
`swap`) onto the wallet-side phases (`signApproval`, `broadcastApproval`,
`buildSwap`, `signSwap`, `broadcastSwap`) and runs them through injected
`SwapFlowPorts` with no React, Lumen, or DMK imports. Already-approved
DEX quotes now go through a wallet-driven direct-swap path instead of
short-circuiting to `{}`. The mobile orchestration hook becomes a thin
adapter that builds LWM ports, runs the shared machine via
`@xstate/react#useMachine`, and derives `executorProps` /
`successScreen` / `enabled` from machine state. A future CLI adapter can
reuse the same machine by implementing the `SwapFlowPorts` contract.
