# @domain/api-network-validators

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

Reads a network's validators on demand into [`@domain/entity-network-validators`](../../entity/network-validators), from the app's ranked sources. The same idea as the [account data router](../../../docs/account-models/data-layer.md), for network data.

- `NetworkValidatorsSource`: `{ id, supports(networkId), read(networkId, { signal }) }`. `supports` is pure and synchronous.
- `networkValidatorsExtra(sources)`: spread into the thunk `extraArgument`. Each app ranks its sources in `src/config/account-data-setup.ts` (`networkValidatorsSources()`): the coin module source, then the legacy preload one.
- `fetchNetworkValidators(networkId, { refresh?, maxAge? })`: a `createAsyncThunk` asking the first ranked source serving the network, then the next one on a failure or an answer the schema rejects. Skipped while a read is in flight or the validators are younger than `maxAge` (5 minutes by default); `refresh` reads anyway and its answer wins over the one in flight. With no source, the error is `NoNetworkValidatorsSourceError`.
- `useNetworkValidators(networkId)`: reads on mount, returns `{ validators, pending, error }`. `validators` is empty until the first answer.

No RTK Query: the validators land in the entity slice, where any screen or selector reads them by network, and the fallback between sources is per network.
