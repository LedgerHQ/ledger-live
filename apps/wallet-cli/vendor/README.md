# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`cbc75a6` on branch `feat/NTTVS-953-solana-send` (native SOL sends, NTTVS-953), on top of
`main` `3f27d3d`. Re-pack from `main` once that branch merges.

SHA-256:

```text
11754a4bcda400fd7bca6395aa20f79be82295ab7bc0799c8839ecd2a980ae80
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
