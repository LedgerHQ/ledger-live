# Full sync (transitional)

Migration in progress into the account-data architecture (`domain/entity/account-*`, `features/platform/account-*`).

Besides the accounts the store holds, it answers `existence` for any account a bridge can sync from its descriptor alone (discovery candidates): one sync kept out of the store, then the family's emptiness rule (`isAccountEmpty` of its bridge extensions). A family whose sync needs more than the descriptor sets `syncsFromDescriptor: false` on its loader, and the router asks the next source.

Shipping code here is legitimate until every dependency on the former `Account` type is released. This folder is on the allowlist of the Danger architecture score in [`tools/danger/legacy-score.ts`](../../../../../tools/danger/legacy-score.ts).
