---
"live-mobile": minor
---

Wire the wallet-side `custom.swap` device-intent flow into Ledger Live
Mobile. Adds the `SwapDeviceIntentPOC` MVVM feature with LWM React
component wrappers around the cross-platform intent definitions exposed
by `@ledgerhq/live-common/wallet-api/Exchange/intents`, plus the
`useSwapDeviceIntentPocOrchestration` hook that builds `SwapFlowPorts`
and drives the shared `swapFlow` XState machine via `@xstate/react`.
The Swap live-app webview now registers a `custom.swap` handler and
renders `SwapDeviceIntentPocHost` alongside the WebView so approval /
swap / permit2 / RFQ steps run through the device-intent executor.
Also adds a temporary `SWAP_API_BASE` staging override in
`live-common-setup.ts` for the POC (to be removed once env wiring is
unified across platforms).
