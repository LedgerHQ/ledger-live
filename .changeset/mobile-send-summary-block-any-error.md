---
"live-mobile": patch
---

Block the send Summary CTA on any transaction-status error.

The Summary screen previously gated its Continue button on a named allowlist of error keys (`transaction`, `NotEnoughGas`, `NotEnoughBalance`, sender/recipient) that omitted others such as `gasLimit`. As a result a `FeeNotLoaded` error — raised by `getTransactionStatus` when gas estimation fails (e.g. an EVM `eth_estimateGas` revert leaving `gasLimit = 0`) — was not enforced, letting the user proceed to sign an unexecutable transaction. Desktop already disables on any error; the Summary CTA now does the same, so every current and future status error blocks the flow by default.
