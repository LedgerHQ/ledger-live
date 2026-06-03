---
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/web-tools": patch
---

chore: upgrade the Rsbuild/Rspack build stack to v2

Bump `@rsbuild/core` to 2.x, `@rspack/core`/`@rspack/cli`/`@rspack/dev-server`/`@rspack/plugin-react-refresh` to 2.x, `@rslib/core` to 0.22, `@rsdoctor/rspack-plugin` to 2.0.0-alpha.0, related plugins, and `storybook-react-rsbuild` to 3.3.4 (with the Storybook 10.x catalog bumped to 10.4). `@swc/helpers` is aligned to 0.5.23 so the `_wrap_reg_exp` runtime helper emitted by `@swc/core` resolves under Rspack v2's stricter `exports` enforcement (mobile bundle). Desktop rspack config updated for the v2 `ReactRefreshRspackPlugin` named export and a `@sentry/types` v6 resolution alias required by Rspack v2's stricter ESM linking. Rsdoctor loader analysis is disabled on mobile (its loader interceptor is not yet Rspack-v2 compatible); bundle analysis is unaffected.
