# @ledgerhq/errors is deprecated

This package is **frozen**. Nothing in this monorepo depends on it anymore, and nothing
may start to: the `enforce-boundaries` CI check fails on any workspace manifest that
declares `@ledgerhq/errors` in any dependency field (see
`tools/nx-plugins/enforce-boundaries/constraints.js`).

It only still lives here so it keeps being published for external consumers.

## Do not

- ❌ Add it back as a dependency of any workspace package.
- ❌ Add new error classes here (whether via `createCustomErrorClass` or hand-written).
- ❌ Use `createCustomErrorClass` in any package.
- ❌ Use the serialization stack — `serializeError`, `deserializeError`,
  `addCustomErrorDeserializer`. Send a plain `{ name, message }` shape over a
  boundary and branch on `error.name` at the consumer.

## Do instead

Define errors as plain native classes in your own package's `src/errors.ts`, and
check their type with `error.name === "X"` rather than `instanceof` (the name
survives serialization across IPC / workers / external frameworks).

In the ledger-live repo, the `errors` skill documents the full how-to,
`libs/ledger-auth/src/errors.ts` is a reference implementation, and
`libs/ledger-wallet-framework/src/errors.ts` is the shared home for errors used by
several coin modules.

## Why it is still here

Two independent reasons, and only the first one has an end in sight.

**1. It is still published.** External consumers resolve `@ledgerhq/errors` from npm, so the
package keeps living here to be released. Removing it from the workspace means no more
publishes — a product decision, not a mechanical follow-up.

**2. An external peerDependency.** `@ledgerhq/coin-module-framework`,
`@ledgerhq/coin-stellar`, `@ledgerhq/coin-xrp` and `@ledgerhq/coin-hypercore` declare
`@ledgerhq/errors` as a `peerDependency` and `require()` it at runtime. With
`auto-install-peers=false` that peer has to be provided by us, so the root `package.json`
bridges it through `pnpm.packageExtensions` pointing at this workspace copy.

`workspace:*` is deliberate there: it reuses this single copy, so the dependency graph keeps
exactly the physical copies it had before. Pinning an npm version instead adds a duplicate
and Desktop Bundle Checks reports a renderer duplication regression.

The bridge has **three parts**, and all are needed:

1. **Resolution** — `pnpm.packageExtensions` in the root `package.json` turns the peer into a
   real dependency for those four, so they can find `@ledgerhq/errors` at all. An override
   alone does not do this: with `auto-install-peers=false` an undeclared peer is never
   installed, it just gets its *range* rewritten (`missing peer @ledgerhq/errors@workspace:*`).
2. **Deduplication** — `pnpm.overrides` carries `"@ledgerhq/errors": "workspace:*"`, the same
   idiom already used for `@ledgerhq/devices` and `@ledgerhq/hw-transport`. Four *other*
   external packages depend on published versions — `@ledgerhq/wallet-api-core` and
   `@ledgerhq/live-network` (the npm one) on `6.36.0`, `iso-filecoin` and
   `@mysten/ledgerjs-hw-app-sui` on `6.32.0` — and the override collapses all of them onto
   this single copy.
3. **Build order** — `targetDefaults.build.dependsOn` in `nx.workspace.json` carries
   `{ "projects": ["@ledgerhq/errors"], "target": "build" }`, so this package is compiled
   before anything that bundles those external packages.

Part 2 is what keeps Desktop Bundle Checks quiet. `extractDuplicatesFromRspack` flags a
package when the renderer contains **two or more distinct versions** under
`node_modules/.pnpm/@ledgerhq+errors@<version>/`; a workspace link does not match that path
at all, so it is invisible to the detector. Before this, `develop` stayed clean only by
accident: `apps/ledger-live-desktop` declared the package, and rspack's
`resolve.modules: [lldRoot/node_modules, …]` search path made every nested request resolve
to that one copy. Removing the declaration exposed the registry copies underneath it.

Part 3 is easy to miss. `lib/` and `lib-es/` are gitignored, so they only exist once
`nx run @ledgerhq/errors:build` has run — and nx derives build order from the *package.json*
project graph, which it cannot see `packageExtensions` in. Without that edge, a clean
checkout resolves the symlink to a source directory with no `lib/index.js` and every bundler
and Jest run fails with `Cannot find module '@ledgerhq/errors'`. A global edge is used rather
than per-project `implicitDependencies` so no consumer can be missed, and so the bridge stays
a few lines to delete instead of dozens.

## Retiring the bridge

Two upstream releases remove the need for these parts, independently:

- [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) drops the
  `peerDependency` from those four coin packages. Once released, parts **1 and 3** can go.
- [LedgerHQ/wallet-api@916d7a3](https://github.com/LedgerHQ/wallet-api/commit/916d7a398ef0dc656e7c5af06524639b20f73b32)
  removes `@ledgerhq/errors` from `wallet-api-core` (local `serialization.ts` replaces
  `serializeError` / `deserializeError`). It is merged but **unreleased** — npm latest is still
  `wallet-api-core@1.35.0` requiring `^6.35.0`. Once released and picked up (our pin is
  `^1.35.0`, so a lockfile refresh suffices), the `6.36.0` copy disappears and the only
  remaining consumers, `iso-filecoin` and `@mysten/ledgerjs-hw-app-sui`, **both pin `6.32.0`**
  — a single version, which the detector ignores. Part **2** can then go too.

After both, nothing in this repo needs the package and it can be deleted — subject to reason 1
above, which is a separate decision.
