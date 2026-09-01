---
"@ledgerhq/coin-canton": minor
---

Build the api from the framework's `notSupportedApi()` instead of hand-writing seventeen
methods whose only body was `throw new Error("… is not supported")`. `createApi` spreads the
framework value and overrides the three methods Canton wires today — `combine`,
`validateAddress` and `craftTransactionData` — taking the file from 112 lines to 21.

Canton could not adopt the `CoinModuleImpl` authoring type: it does not implement six of the
eight methods that type requires, so the capabilities it lacks cannot be expressed by
omission. Spreading a fully-stubbed api satisfies the contract statically instead, and makes
what the module actually does readable at a glance — which for a module still being built is
the useful part.

That also makes the mislabelling below structurally impossible: the error message follows the
method name, so it can no longer disagree with the method it stands for. And `getAccountInfo`
resolves the ADR-045 `{ type: "none" }` sentinel from the module itself rather than being
backfilled by the resolver's `withDefaults` — the same value a consumer already received.

One behavioural nuance: `call` and `register` were `async` functions that threw, returning a
rejected promise. The framework stubs throw synchronously — same error, one tick earlier,
which a caller using `.catch()` rather than `try`/`catch` would notice.

Report the right method name when `lastBlock` is called.

`lastBlock` raised `"listOperations is not supported"`, so a caller hitting the unimplemented block layer was pointed at the wrong method.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `combine` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
