# @domain/api-earn-positions

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Reads the Earn staking positions of a wallet address, and the APY of the Solana validators, from the
Earn backend. Its endpoints are injected into `earnApi`, the Earn service of `@shared/api-services`,
and return the entities of `@domain/entity-earn-position`. First consumer: the Solana position modal of
`@features/flow-stake-position`.

## Exports

| Export | Does |
| --- | --- |
| `useGetEarnPositionsQuery({ network, address, fresh? })` | `POST /v3/stakes` with `[{ network, address, fresh? }]`, returns `EarnPositions` |
| `useGetSolanaValidatorApyQuery()` | `GET /figment/solana/validators_summary`, returns `SolanaValidatorApyByVoteAccount` |
| `selectSolanaValidatorApy(lookup, voteAccount)` | The APY of one validator, for `selectFromResult` |
| `useRefreshEarnPositions()` | Returns `(address) => void`, which invalidates the cached positions of that address |
| `earnPositionsApi`, `EARN_POSITIONS_TAG` | The injected api, and the tag its positions provide, with the address as id |
| `GetEarnPositionsArgs`, `SolanaValidatorApyByVoteAccount` | The argument and the result types |

`react-redux` is imported here only: a feature dispatches through `useRefreshEarnPositions`.

## Behavior

- **Positions.** Only the SOL stake accounts (`SolanaDetailsView` rows) of the requested address are
  kept. The failure rows a provider sends with HTTP 200 (`BatchedErrorView`, `StakeViewV1Failure`)
  become `failures`, never an empty result. A payload that breaks the contract (no `meta`, a SOL row
  without its stake account) is a query error `CUSTOM_ERROR`. A displayed value that cannot be read is
  left undefined. Cached for 5 minutes. `fresh: true` has its own cache entry and 20 s instead of 10 s;
  `fresh: false` shares the entry of the plain read.
- **Validator APY.** A record of vote account to fraction. An entry without a vote account, or whose
  APY is not a finite number from 0 to 1, is dropped; a payload that is not a list is a query error.
  Cached for 1 hour. It fails on its own, without failing the positions.
- **Transport**, from the Earn service: a network failure or a 5xx is retried twice, a 4xx never, and a
  request that times out ends with `TIMEOUT_ERROR`, not retried, so the caller decides when to read
  again. An empty or malformed base URL fails softly with `CUSTOM_ERROR`.

## Wire mapping

Every wire field name lives in `src/internals/stakes.ts`, so a rename is a one-line change there.

| Entity | Wire (`StakeViewV1Success`) |
| --- | --- |
| `id` | `details.stake_account` |
| `validatorAddress` | `details.validator_address` (vote account, may be empty) |
| `validatorName`, `validatorLogoUrl` | `protocol_name`, `logo` |
| `status` | `status` (a status this version does not know reads as `unknown`) |
| `balance` | `staked_balance` |
| `totalRewards` | `rewards[]`, the entry whose `currency` is the row's, its `total` |
| `positionApy` | `interest.value`, a fraction |
| `deposited` | `details.deposited_balance`: a placeholder name, the backend has yet to add the field |
| `updatedAt` | `details.updated_at` |
| `isStale`, `respondedAt` | `meta.is_stale`, `meta.responded_at` |

## Usage

The app registers the Earn service once, with the base URL it resolves; the feature imports the hooks.

```ts
import { defineApiServices, earnService } from "@shared/api-services";

const services = defineApiServices([earnService(() => ({ earnApiBaseUrl }))]);
```

```ts
import {
  selectSolanaValidatorApy,
  useGetEarnPositionsQuery,
  useGetSolanaValidatorApyQuery,
  useRefreshEarnPositions,
} from "@domain/api-earn-positions";

const { data, error } = useGetEarnPositionsQuery({ network: "solana", address }, { skip: !address });

const { validatorApy } = useGetSolanaValidatorApyQuery(undefined, {
  skip: !validatorAddress,
  selectFromResult: ({ data }) => ({
    validatorApy: selectSolanaValidatorApy(data, validatorAddress),
  }),
});

const refreshEarnPositions = useRefreshEarnPositions();
refreshEarnPositions(address);
```
