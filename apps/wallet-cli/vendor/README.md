# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `62a96ed` (branch `feat/NTTVS-925-recover-all-sources`,
[LedgerHQ/agent-intent-sdk#15](https://github.com/LedgerHQ/agent-intent-sdk/pull/15),
not merged yet). Re-pack from the `main` merge commit once #15 lands.

SHA-256:

```text
14cf25de7b8b0a8265d1bbe831241eda9be1e229f0df7c89e9da09dff0d8866a
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
