---
"@ledgerhq/coin-module-boilerplate": minor
---

Migrate the boilerplate to the coin-module authoring type, establishing the shape every new module copies.

`createApi` now returns an object checked against `CoinModuleImpl` with `satisfies`, declaring only the eight methods the module implements. `satisfies` rather than a return-type annotation, so the precise shape survives: a caller sees exactly which methods exist, and referencing an omitted one is a compile error instead of an optional to silence — an annotation would widen every capability back to optional, including the ones the module does implement. The eleven capabilities the chain has none of — `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateIntent`, `getNextSequence`, `validateAddress` — are simply left out instead of each carrying a hand-written `throw new Error("… is not supported")`. The consumer reaches the module through a resolver that applies `withDefaults`, which supplies every omitted capability, so the surface a caller sees is unchanged and `supports()` now reports which ones are real.

The module's own test asserts both halves of that contract, since this is the reference shape: what `createApi` declares, and what the same value looks like once wrapped.

Because a module may now omit methods, a direct `createApi` call no longer receives a complete object. `no-restricted-imports` rejects one, in both the `ledger-live-common` and `coin-modules` configs, so a new bypass fails the existing lint job. The per-family `coinModuleApi.ts` adapters the resolver loads are exempt, as are test files, along with the four callers previously established as unable to break — celo's synchronisation and its composing `createApi`, `getTokenAllowance`, and the Canton mock bridge.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `craftTransaction`, `estimateFees` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
