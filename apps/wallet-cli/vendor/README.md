# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`main` commit `00d6830` (list, get and cancel intents with typed send and swap fields, swap,
native SOL and SPL token send intents, the agentic User-Agent, the app.agents frontend
links, relay channels kept open past the idle timeout, and cross-realm request headers).

SHA-256:

```text
d4f33da42e3e991c627af1a641a930a1f96938f0ed7c16e8817c1a73dd3f1379
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
