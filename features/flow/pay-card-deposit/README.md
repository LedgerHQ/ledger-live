# Pay Card Deposit

> [!CAUTION]
> **Status: UNSTABLE** — Scaffold only; public API is still being designed.

Dual-platform flow package that will host the Pay tab **Deposit options** experience for Ledger
Wallet (bottom sheet on mobile, dialog on desktop).

## Scope

This package is currently an **empty scaffold** created in
[LIVE-36004](https://ledgerhq.atlassian.net/browse/LIVE-36004) so it can be reviewed on its own and
imported by the follow-up UI tickets.

The Deposit options list (Bank transfer, Swap, Receive, Buy), its view-model, Lumen rows, host
navigation intents and tracking are added in
[LIVE-34910](https://ledgerhq.atlassian.net/browse/LIVE-34910) and its platform tickets. Until then
the barrels only expose a compile-only placeholder.

## Platform resolution

The package follows the dual-platform flow template: `package.json` resolves `.` through a
`react-native` condition (`src/index.native.ts`) and a `default` condition (`src/index.ts`), and
platform-specific views will use `.web.tsx` / `.native.tsx` suffixes resolved by the bundlers and
`tsconfig.{web,native}.json`.

## Structure

```text
pay-card-deposit/
├── package.json
└── src/
    ├── index.ts              # Public API (default)
    ├── index.native.ts       # Public API (react-native condition)
    └── placeholder.ts        # Compile-only placeholder (removed once real exports land)
```
