# XRP MPT clear signing: prototype setup

Prototype only. This folder holds temporary mocks to test clear signing of
Multi-Purpose Tokens (MPT) on a device before the real pieces ship:

- The Ledger Crypto Assets List (CAL) has no MPT descriptors yet.
- `@ledgerhq/device-signer-kit-xrp` and `@ledgerhq/context-module` with MPT
  support are not published yet.

Delete everything listed in [Removing the prototype](#removing-the-prototype) once both ship.

## Requirements

- XRP app 2.9.0 or later. Older versions refuse the descriptor (`6d00`) and sign as before.
- Speculos on **Nano S Plus**, started **without `-p`**, so it trusts the test public key infrastructure (PKI).
- The `ldmkXrpSigner` feature flag on. Without it, [setup.ts](./setup.ts) uses the legacy
  `hw-app-xrp` signer, which never sends descriptors.

## 1. Use unpublished DMK packages through local tarballs

The device-sdk-ts branch `feat/no-issue-xrp-mpt-signer` changes two packages:
`signer-xrp` (sends the certificate `B0 06` and the descriptor `E0 22` before signing) and
`context-module` (loads MPT descriptors). Both must be swapped. The signer calls
`setChain(ContextModuleChainID.Xrp)`, which the published `context-module` lacks.

In the device-sdk-ts checkout, on that branch:

```bash
pnpm install
pnpm turbo run build --filter=@ledgerhq/device-signer-kit-xrp...
cd packages/signer/context-module && pnpm pack --pack-destination <ledger-live>/../dmk-tarballs
cd ../signer-xrp && pnpm pack --pack-destination <ledger-live>/../dmk-tarballs
```

`pnpm pack` turns `workspace:^` and `catalog:` into real versions. The branch versions match
the ledger-live catalog, so the app keeps one copy of `@ledgerhq/device-management-kit`.

In ledger-live, point `overrides:` in [pnpm-workspace.yaml](../../../../../pnpm-workspace.yaml)
at the tarballs (paths are relative to the repo root), then run `pnpm install`:

```yaml
"@ledgerhq/context-module": "file:../dmk-tarballs/ledgerhq-context-module-2.8.0.tgz"
"@ledgerhq/device-signer-kit-xrp": "file:../dmk-tarballs/ledgerhq-device-signer-kit-xrp-0.3.0.tgz"
```

Replace the existing `@ledgerhq/context-module` override. A duplicate YAML key is an error.

Prefer tarballs over `link:`. A linked package resolves its dependencies from the
device-sdk-ts `node_modules`, so the app gets a second copy of the DMK, and Metro does not
follow symlinks outside the repo.

After a change on the device-sdk-ts side: build, pack, then `pnpm install` again. If the
old code still runs, delete `node_modules/.pnpm/@ledgerhq+context-module*` and
`node_modules/.pnpm/@ledgerhq+device-signer-kit-xrp*`, then reinstall.

Rebuild `libs/live-signer-xrp` and `libs/ledger-live-common` before you start an app:
Ledger Wallet Desktop loads live-common from `lib-es`.

## 2. The MPT descriptor mock

[mptDescriptorMock.ts](./mptDescriptorMock.ts) is a `ContextModule` that
[setup.ts](./setup.ts) passes to `DmkSignerXrp`, which hands it to
`SignerXrpBuilder.withContextModule()`. On each signature it:

1. Finds the issuance id of each MPT from [devTokens.ts](./devTokens.ts) in the raw transaction (2 at most: the app has two descriptor slots).
2. Builds the descriptor TLV from the dev token: structure type `0x90`, version `1`,
   coin type `144'`, app name `XRP`, ticker, decimals, and the issuance id as the token id.
3. Signs it (DER ECDSA over SHA-256) with the public app-boilerplate `dynamic_token` test key.
4. Returns it with the Nano S Plus `dynamic_token` test certificate, key usage `0x08`.

The DMK signer then sends the certificate and the descriptor, and the device shows the MPT
ticker and amount instead of asking for blind signing. On another device model the mock
returns nothing, and the transaction is blind-signed.

The test key works only on Speculos with the test PKI. Production devices refuse it. Never ship
this file.

## Removing the prototype

- Delete `mptDescriptorMock.ts` and stop passing it in `setup.ts`. The default context module
  then loads descriptors from the CAL.
- Delete `devTokens.ts` and `withXrpDevTokens` once the CAL lists XRPL tokens.
- Restore the `pnpm-workspace.yaml` overrides and the catalog once the DMK packages are published.
- Recheck the `"6982"` widening in `libs/live-signer-xrp/src/DmkSignerXrp.ts`: the new signer
  dropped that code from `XrpErrorCodes`.
