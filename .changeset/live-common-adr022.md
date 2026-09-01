---
"@ledgerhq/live-common": minor
---

Apply the coin-module framework's `withDefaults` and `withLogging` wrappers at `getCoinModuleApi`, the single point where the generic adapter resolves a coin module, on both the local and the network branch.

`withDefaults` backfills the capability methods a module does not implement, so a module may omit them rather than hand-write a throwing stub, and every consumer of the resolver receives the same complete surface whichever module answered. It also exposes `supports(method)`, which reports whether a capability is really implemented or is running on the framework default. `withLogging` reports each call through the logger carried by the per-call `Context`, giving one uniform trace for every consumed module instead of per-module instrumentation.

Behavior of implemented methods is unchanged: the wrappers forward the `Context` verbatim, leave arguments and results untouched, and preserve the members a module carries beyond the API surface — the resolver keeps handing out a value that satisfies both `CoinModuleApi` and `BridgeApi`.

Drop the hand-written "not supported" stubs from the generic adapter's network client. `craftRawTransaction`, `getBlock`, `getBlockInfo`, `getStakes`, `getRewards`, `getValidators`, `validateAddress`, `call` and `register` were each a method whose only body was `throw new Error("<name> is not supported")` — a copy of what the coin-module framework's `withDefaults` already provides. The client now declares itself a `CoinModuleImpl` and simply omits them, and the resolver's `withDefaults` supplies the same error from one place.

Callers see no change: the same method names raise the same message. What improves is introspection — `supports()` can now tell that these capabilities are absent, which was impossible while a throwing placeholder occupied the slot and looked exactly like an implementation.

`call` remains the one intended to arrive; it is to be wired to the coin-service `call` endpoint once the backend exposes it (BACK-11825).

Stop reaching an optional coin-module method behind a non-null assertion in the Tezos readiness check.

`getAccountInfo` is optional on `CoinModuleApi`, and `getAccountReadiness` called it as `api.getAccountInfo!(…)` on an api obtained straight from `createApi`. A module that does not report account metadata would therefore have failed there at runtime, with nothing failing at compile time. The call now goes through the framework's `withDefaults`, which always supplies the method, and it distinguishes a real answer from the `{ type: "none" }` sentinel: with no metadata to read there is no reveal state to gate on, so the account is left ungated — the same position as a family that provides no readiness hook at all.

An audit of every other place that calls a coin module's `createApi` directly found none that can break this way, so they are left untouched: celo's synchronisation uses only `lastBlock` and `listOperations`, both required methods; `getTokenAllowance` discards the value entirely, calling `createApi` for its coin-config side effect; celo's own `createApi` composes the EVM one and is itself wrapped by the resolver; the Canton mock bridge is reached only under the mock environment.
