# @domain/entity-earn-position

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

An Earn staking position, as the Earn backend reports it for a wallet address: one position per stake
account, never merged. `@domain/api-earn-positions` builds it from the backend response; the first
consumer is the Solana position modal of `@features/flow-stake-position`.

## Main exports

| Export | Holds |
| --- | --- |
| `EarnPositionSchema`, `EarnPosition` | One position: `id` (the stake account address), `network`, `ownerAddress`, `validatorAddress`, `status`, and the optional `validatorName`, `validatorLogoUrl`, `balance`, `deposited`, `totalRewards`, `positionApy`, `updatedAt` |
| `EarnPositionsSchema`, `EarnPositions` | The result for one address: `positions`, `failures`, `isStale` and the optional `respondedAt` |
| `EarnPositionStatusSchema`, `EarnPositionStatus` | `activated`, `activating`, `deactivating`, `deactivated`, `archived`, `unknown` |
| `BaseUnitAmountSchema`, `BaseUnitAmount` | An amount in the smallest unit of its currency, as a digit string. A number is accepted only while it is a safe integer |
| `ApyFractionSchema`, `ApyFraction` | A yearly rate as a finite fraction from 0 to 1 |
| `EarnPositionIdSchema`, `EarnPositionsFailureSchema` | The id of a position, and a failure a provider reported for the address |

Mock factories, out of the barrel: `mockEarnPosition(overrides)` and `mockEarnPositions(overrides)`
from `@domain/entity-earn-position/schema.mock`.

## Reading a result

- Positions: the address holds them.
- No position and no failure: the address holds none.
- A failure: a provider could not read some positions of the address, so a position missing from
  `positions` may still exist. Do not read it as "no position".

Every optional field may be absent, and a display hides its row then. Nothing is computed from other
fields: `deposited` is never `balance` minus `totalRewards`. `positionApy` is the reward rate of the
position, not the APY of its validator. `validatorAddress` is empty while the stake account is not
delegated. `isStale` says that some rows were missing or past their time to live when the backend read
them, not that the chain changed since.

```ts
import { mockEarnPositions } from "@domain/entity-earn-position/schema.mock";

const result = mockEarnPositions({ positions: [], failures: [{ code: 503, reason: "Unavailable" }] });
```
