# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `a22bd17`, the head of the unmerged
[PR #14](https://github.com/LedgerHQ/agent-intent-sdk/pull/14) (enrollment
channel connect/deliver split and agent recovery). Re-pin it to the merged
commit once that PR lands.

SHA-256:

```text
643be65809afa0d0c4e97c28f91848e4cd71dec147af3f2b02327dd835077e30
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
