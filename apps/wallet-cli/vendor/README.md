# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `d99ce75` (branch `feat/NTTVS-749-cancel-intent`,
[LedgerHQ/agent-intent-sdk#22](https://github.com/LedgerHQ/agent-intent-sdk/pull/22), stacked
on #17 and the merged #16: adds `listIntents`, `getIntent` and `cancelIntent`). Re-pack from
the `main` merge commit once #17 and #22 land.

SHA-256:

```text
b95d184012dbff10ed6b71e3d0784d0935d41d9c654ccad22cd0ac4af2078d59
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
