# @features/flow-pay-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay tab contact flow for Ledger Wallet Desktop and Mobile. It will hold the Pay tab contacts
strip/table presentation and its shared view-model (stablecoin-filtered list, empty state, and the
press intent that hands off to the Send flow with `source: Pay`).

The package is currently a scaffold with an empty public API; the view-model and platform
presentations are added in follow-up tickets (LIVE-35378 for the shared view-model, plus the
LWD/LWM mount tickets).

## Public API vs leaves

This package owns the Pay-tab contact flow; it does **not** re-export the generic Contacts
packages. Apps that need contacts data or the contacts management UI keep importing
`@features/flow-contacts` / `@features/platform-contacts` directly.

## Platform resolution

Only views carry a platform suffix (`.web` / `.native`). The `exports` condition in `package.json`
selects the barrel (`index.ts` for web, `index.native.ts` for React Native); both re-export the
shared `./exports` public surface.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-contact/
├── package.json
└── src/
    ├── index.ts          # Web public API barrel → ./exports
    ├── index.native.ts   # Native public API barrel → ./exports
    └── exports.ts        # Shared public surface (empty for now)
```
