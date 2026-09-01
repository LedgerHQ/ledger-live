---
"@ledgerhq/coin-stacks": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

`createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities Stacks has none of instead of giving each a `throw new Error("… is not supported")`.

Why each is absent is recorded above the factory rather than lost with the stub it used to sit on: pox-5 exposes only an accrued reward total rather than a series of distribution events, and `getStakes` already reports it; there is no enumerable validator set, since a stake targets a pool signer read from the staker's own pox-5 entry; the module accepts no externally-built transaction; no read-only contract-call escape hatch is exposed; and there is no enrollment step.

`getStakes` stays, so staking is covered a la carte: the one staking read pox-5 can answer cheaply is real while the other two are absent.

`combine` keeps its `throw`: it rejects a signature array that does not hold exactly one entry, which is argument validation on an implemented method rather than an unimplemented capability.

Consumers see no change. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — except that the default throws synchronously where the stub it replaces was an `async` function returning a rejected promise. `supports(method)` now reports which capabilities are real.

The authored type also keeps the contract's trailing optional parameters, or a caller reaching the module through it could no longer pass them: `broadcast`, `combine`, `getStakes` accept and ignore theirs. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.
