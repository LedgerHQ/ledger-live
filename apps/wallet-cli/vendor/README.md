# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`main` commit `530e684` (list, get and cancel intents with typed send and swap fields, swap,
native SOL and SPL token send intents, the agentic User-Agent, and the app.agents frontend
links).

SHA-256:

```text
f8f3ff33b356d94d64e78e332552849c6932de4a6503345e047565832c5f1cf0
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
