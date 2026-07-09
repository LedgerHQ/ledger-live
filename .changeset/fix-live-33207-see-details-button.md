---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix "See details" button in the swap live app — the handler on both desktop and mobile tried to destructure `params.swapId` from the wallet-api message but the live app sends `undefined` params, causing a silent TypeError that prevented any navigation. Desktop now calls `redirectToHistory()` directly; mobile uses `StackActions.replace` at the root navigator level to properly close the live app webview and land on the swap history page.
