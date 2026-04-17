---
"@ledgerhq/wallet-cli": patch
---

Fix JSON mode error output: route error envelopes to stdout (not stderr) so they are captured reliably on all platforms, use correct `{ ok: false, error: { command, message } }` envelope shape, and ensure invalid descriptor errors are caught by the error boundary
