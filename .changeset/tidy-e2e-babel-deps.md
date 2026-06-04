---
"ledger-live-mobile-e2e-tests": patch
---

Declare `@babel/plugin-transform-dynamic-import` and `@babel/plugin-transform-modules-commonjs` as explicit devDependencies. They were referenced by `babel.config.js` since #18119 but resolved via pnpm hoist luck, causing `Cannot find module '@babel/plugin-transform-dynamic-import'` on jest globalSetup.
