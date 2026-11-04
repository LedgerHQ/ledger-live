---
name: wrap-third-party-libs
description: |
  Apps do not depend on third-party libraries directly: the lowest valid package owns each one.
  Read before adding a dependency to apps/*/package.json, importing a new npm package from an app,
  or bumping a library the apps use.
---

# Wrap third-party libs below the apps

An app's `package.json` lists workspace packages and the exceptions below (framework singletons, the design system, tooling). A library that serves one capability (QR code, signature check, storage, id generation) belongs to a package below the app, which exposes a small API of our own.

## Why

- Every direct app dependency is a potential silent override. The renderer's `resolve.modules` puts the app's `node_modules` first, so the app's copy wins over the version a library declared for itself (`@noble/curves` v1 forced onto a v2 consumer crashed Desktop at boot).
- Desktop and mobile each pick a different lib for the same job (`qrcode` vs `react-native-qrcode-svg`). One owner gives one behaviour and one test.
- Bumping or swapping a lib touches one package, not two apps.

## Rule

1. Before adding a dependency to `apps/*`, look for an existing owner package. If none, create one.
2. Place the owner in the lowest valid layer of the [structure-flow](../structure-flow/SKILL.md) table (`shared`, `domain`, `features/platform`, `features/flow`), for example:
   - business-agnostic (QR code, clipboard, linking, list reorder): `shared/<name>`, e.g. `@shared/ui-qr-code`
   - capability shared across flows or apps: `features/platform/<name>`
   - used by one flow or one domain: that `features/flow` or `domain` package
3. The package declares the third-party lib in its own `dependencies` (`catalog:` when a catalog entry exists). Apps and other packages import the package by name, never the lib.
4. The public API hides the lib: no lib types or instances in exports, so the lib can be replaced without touching callers.
5. Add a test in the package that exercises the real lib, including the success path.

## Examples

Existing app dependencies predate this rule and are migrated over time; do not add new ones.

- [`shared/ui-qr-code`](../../../shared/ui-qr-code) (intent of the pattern; its API and placement are still under platform review): owns `qrcode`; apps render `<QrCode />` (Desktop still declares `qrcode` until migrated).
- [#23097](https://github.com/LedgerHQ/ledger-live/pull/23097): `@noble/curves` and `@trust/keyto` moved out of Desktop into `@features/platform-app-update`; `sslHelper.verify` became a wrapper. Precedent for isolating a lib an app used once; the package is Desktop-only today, so it is not a placement model for new packages.

## Exceptions

Keep a direct app dependency for libraries that must be a singleton across the bundle (react, react-dom, redux, react-router, styled-components, i18next), for the design system (`@ledgerhq/lumen-*`), and for build or tooling packages. Anything else goes behind a package; if you think it is an exception, ask in the PR before adding it.

## Review

- Does the PR add a runtime dependency to `apps/*/package.json`? Ask which package should own it.
- Does an app import a library that a `shared/` or `features/platform/` package already wraps? Use the package.
- Do two apps use different libs for the same job? Move both behind one package.