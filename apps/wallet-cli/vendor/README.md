# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `4ceba0a`. Same artifact `agent-intent-frontend` vendors at
`vendor/ledgerhq-agent-intent-sdk-0.0.0.tgz`, kept in sync with it here.

SHA-256:

```text
9d1348295478791f9b6b6904d698929ddd58cfc84fbe3a28852685a20152eb1d
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
