# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
commit `05b785a` (branch `feat/NTTVS-747-list-intents`,
[LedgerHQ/agent-intent-sdk#16](https://github.com/LedgerHQ/agent-intent-sdk/pull/16),
not merged yet: adds `listIntents`). Re-pack from the `main` merge commit once #16 lands.

SHA-256:

```text
89fd790d36abb1ba871f95974f5510eb4185957db3fdb56eb246d90483abcbfd
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
