# @ledgerhq/esm-fix-extensions

Post-build tool that makes a `tsc --moduleResolution bundler` ESM output (`lib-es`)
loadable by Node's **native ESM** resolver, without touching source.

Given a built output directory it:

- rewrites relative import/export specifiers to concrete targets (`./x` → `./x.js`,
  directory → `./x/index.js`) — Node ESM does not do extension/index resolution;
- injects `createRequire` / `__dirname` shims into files that still contain those CJS
  globals verbatim (e.g. a lazy `require("https")`), which are `undefined` under ESM;
- writes `<dir>/package.json` `{ "type": "module" }` so Node treats the output as ESM
  without syntax-detection reparsing.

Source stays extensionless (bundler-style), so this is **complementary** to the
`moduleResolution: bundler` direction (LIVE-29251 / #18120), not a reversal.

## Usage

```sh
esm-fix-extensions lib-es
```

Wire it after the `lib-es` emit in a package's build script:

```jsonc
"build": "tsc -p tsconfig.build.json && tsc -p tsconfig.build.json -m esnext --moduleResolution bundler --outDir lib-es && esm-fix-extensions lib-es"
```

It is idempotent (already-explicit specifiers and already-shimmed files are skipped).

## Scope / LIVE-31760

This tool is the proven mechanism for [LIVE-31760](https://ledgerhq.atlassian.net/browse/LIVE-31760)
(make `lib-es` Node-native-ESM loadable). It was validated end-to-end on the
`@ledgerhq/device-core` dependency graph (12 workspace libs load under
`node --input-type=module`).

A **full** rollout (every consumer loads in native ESM, drop the e2e CJS shim from
[#18119]) is **not** achievable from this repo alone:

- ~24 external published `@ledgerhq/*` catalog deps (e.g. `coin-module-framework`,
  `coin-xrp`, `device-management-kit`, `wallet-api-*`) ship extensionless `lib-es`
  from the immutable pnpm store and would each need republishing with this transform;
- workspace libs build `lib-es` in heterogeneous ways (CLI `--outDir` vs tsconfig
  `outDir`), so wiring must cover both.

This package is therefore landed standalone as the foundation; wiring it into lib
builds is a follow-up gated on the external-dependency republish strategy.
