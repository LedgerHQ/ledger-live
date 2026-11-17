# Discovery (transitional)

Derives discovery candidates on the session of the Device Intent that runs the scan (`deriveOnSession`): each family's resolver, or its `deriveAccountDescriptor`, on a `DmkCompatTransport`, which the family setups route to the DMK signer kits where they have one. It serves [`@features/platform-account-discovery`](../../../../../features/platform/account-discovery); the candidates' `accountStatus` is answered by the [full sync](../full-sync) source.

Shipping code here is legitimate until each family derives its descriptor with a DMK signer kit, outside live-common. This folder is on the allowlist of the Danger architecture score in [`tools/danger/legacy-score.ts`](../../../../../tools/danger/legacy-score.ts).

A family not known by the address its resolver gives (UTXO families, Cardano, Kaspa, Hedera) needs a `deriveAccountDescriptor` in its setup; until it has one, its candidates fail with `LegacyDeriveUnsupportedError`.
