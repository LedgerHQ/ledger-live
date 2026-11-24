# Full sync (transitional)

Migration in progress into the account-data architecture (`domain/entity/account-*`, `features/platform/account-*`).

Besides the accounts the store holds, it answers `accountStatus` for any account a bridge can sync from its descriptor alone (discovery candidates): one sync kept out of the store. A family whose first sync needs more than its descriptor (an onboarding: Canton, Concordium) answers `accountStatus` from its coin module, which the router asks first. In mock mode, a descriptor of an account the mock scan finds gets that account, so its status matches the scan.

Shipping code here is legitimate until every dependency on the former `Account` type is released. This folder is on the allowlist of the Danger architecture score in [`tools/danger/legacy-allowlist.json`](../../../../../tools/danger/legacy-allowlist.json).
