# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`c4ccd47`
([LedgerHQ/agent-intent-sdk#19](https://github.com/LedgerHQ/agent-intent-sdk/pull/19):
Swap intents, on top of `main` `3f27d3d`). Re-pack from `main` once #19 merges.

SHA-256:

```text
2c5b21e21dbaeca2e3eda3bd3d719be15b3a25ff583f06953999db6c4a569c59
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
