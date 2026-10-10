# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `2629bfc` (branch `feat/NTTVS-748-get-intent`,
[LedgerHQ/agent-intent-sdk#17](https://github.com/LedgerHQ/agent-intent-sdk/pull/17), on top
of the merged #16: adds `listIntents` and `getIntent`). Re-pack from the `main` merge commit
once #17 lands.

SHA-256:

```text
744cbcc032cfa336185f4bedeace6abde0a9aa219fa377a7c18c2111276b2062
```

The tarball contains compiled JavaScript and declarations, not another editable
copy of the SDK source. To refresh it:

```sh
cd ../../../agent-intent-sdk
pnpm verify
pnpm pack --pack-destination ../ledger-live/apps/wallet-cli/vendor
```

Update the checksum and commit reference above after replacing the artifact.
Remove the tarball and switch `package.json` to the registry version as soon as
the package is published.
