# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `0aa03d2` (branch `feat/NTTVS-748-get-intent`,
[LedgerHQ/agent-intent-sdk#17](https://github.com/LedgerHQ/agent-intent-sdk/pull/17),
stacked on #16, not merged yet: adds `listIntents` and `getIntent`). Re-pack from the
`main` merge commit once #16 and #17 land.

SHA-256:

```text
7a259e9ed2c8705179630dcfecb516947862e74316a1ca2ff674c4b467ab61ba
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
