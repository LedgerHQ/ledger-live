# Discovery (transitional)

Derives discovery candidates on the session of the Device Intent that runs the scan (`deriveOnSession`): each family's resolver, or its `deriveAccountDescriptor`, on a `DmkCompatTransport`, which the family setups route to the DMK signer kits where they have one. It serves [`@features/platform-account-discovery`](../../../../../features/platform/account-discovery); the candidates' `accountStatus` is answered by the [full sync](../full-sync) source.

Shipping code here is legitimate until each family derives its descriptor with a DMK signer kit, outside live-common. This folder is on the allowlist of the Danger architecture score in [`tools/danger/legacy-allowlist.json`](../../../../../tools/danger/legacy-allowlist.json).

A family not known by the address its resolver gives (UTXO families, Cardano, Kaspa, Hedera) needs a `deriveAccountDescriptor` in its setup; until it has one, its candidates fail with `LegacyDeriveUnsupportedError`.

Polkadot also has one: once Polkadot migrated to Asset Hub, the account is named on `assethub_polkadot`, where the scan and the sync put it.

## Completion

After the user selected accounts, `completeOnSession` runs the device step of a family that needs one (`FamilySetup.completeAccountDescriptors`, announced by the loader's `accountCompletion`). It shares the session queue of `deriveOnSession` (`session.ts`), so it never overlaps a derivation still running. `needsCompletion` reads the loader only. A completed account keeps its descriptor; the device's answer is its account context, which the host hands to `syncDetached` to rebuild the full account. Aleo asks the view key of each account. Hedera reads the device public key, without an approval: its descriptor is keyed on the account id, and receive and sign check the device against the key, which the legacy account keeps as its `seedIdentifier`.
