# @domain/entity-network-validators

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The validators a network offers for staking. Network data, not account data: keyed by `NetworkId` from [`@domain/entity-account-descriptor`](../account-descriptor), never by `AccountUUID`, and read on demand by the screen showing them, never preloaded (see [account models](../../../docs/account-models/README.md), paradigm 8).

- `NetworkValidator`: `id` (what staking positions refer to: the validator address on Cosmos), `name`, and when the source knows them `address`, `commission` (0 to 1), `apy` (0.1 for 10%), `totalStaked` (an integer string in the smallest unit of the network's coin), `iconUrl`, `url`, and `isLedger: true` when Ledger runs it (screens put it first). Only what screens show.
- The `networkValidators` slice holds, per network, `{ validators, receivedAt?, pending?, error? }`. A failed read keeps the stored validators. Only the answer of the read in flight is stored: an older one is dropped.
- Actions `networkValidatorsRequested`, `networkValidatorsReceived`, `networkValidatorsFailed`, dispatched by `fetchNetworkValidators` of [`@domain/api-network-validators`](../../api/network-validators).
- Selectors `selectNetworkValidators(state, networkId)`, `selectNetworkValidator(state, networkId, validatorId)`, `selectNetworkValidatorsEntry(state, networkId)`. Apps mount the slice at `networkValidators`.
- Mocks: `./schema.mock` (`mockNetworkValidator`), `./slice.mock` (`mockNetworkValidatorsState`).
