# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`3e7fb3e` on branch `feat/NTTVS-953-solana-send` (native SOL sends, NTTVS-953), on top of
`main` `3f27d3d`. Re-pack from `main` once that branch merges.

SHA-256:

```text
910fe2a75f2513da56e324198eab3396112bbbb3ad5d409b17186e639bab55ed
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
