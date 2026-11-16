# Network validators sources (transitional)

Migration in progress into the account-data architecture (`domain/entity/network-validators`, `domain/api/network-validators`).

These are the coin-family adapters behind the `NetworkValidatorsSource` contract: the validators a legacy currency bridge preloads (Cosmos family) and the ones a local coin module lists, with the Ledger validator flagged from the currency config. They read live-common bridges, coin modules and currency config, so they cannot live in a layer package. The entity, the slice and the source contract already live in `domain/`.

Shipping code here is legitimate until every dependency on the former `Account` type is released. This folder is on the allowlist of the Danger architecture score in [`tools/danger/legacy-score.ts`](../../../../../tools/danger/legacy-score.ts).
