---
"ledger-live-desktop": minor
---

fix: use BrowserRouter instead of HashRouter

`HashRouter` doesn't support the `location.state` as seen [here](https://github.com/remix-run/react-router/blob/v5/packages/react-router-dom/docs/api/HashRouter.md)

We use [`electron-serve`](https://github.com/sindresorhus/electron-serve) to support the `BrowserRouter`
