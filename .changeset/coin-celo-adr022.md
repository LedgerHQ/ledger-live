---
"@ledgerhq/coin-celo": minor
---

Adopt the coin-module authoring type, dropping the hand-written "not supported" stub.

This module composes the EVM api and overrides the parts Celo implements itself, so its shape follows coin-evm's. `createApi` now returns its object with `satisfies`, which keeps `stakingSupported` — a member outside the API surface — visible in the type, and drops the `register` stub in favour of the framework default.

`craftRawTransaction` is the one capability neither this module nor the EVM api it composes provides, so it is simply absent. That matters here more than elsewhere: the composed api arrives through an `as unknown as` cast, which would have let a method that no longer exists keep claiming it does, and a caller would have met `undefined is not a function` rather than a "not supported" error. The cast now names the authoring type, and spells out `validateIntent` as required since every non-staking intent is delegated to it — so dropping it upstream breaks the build instead of the runtime.

Consumers see no change: the resolver applies `withDefaults`, which supplies the absent capabilities.

The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `combine` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.
