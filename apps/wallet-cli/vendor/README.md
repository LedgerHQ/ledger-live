# Vendored dependencies

## `@ledgerhq/agent-intent-sdk`

`ledgerhq-agent-intent-sdk-0.0.0.tgz` is a temporary packed artifact from
[`LedgerHQ/agent-intent-sdk`](https://github.com/LedgerHQ/agent-intent-sdk) at
`main` commit `4218d88` (list, get and cancel intents with typed send and swap fields, swap,
native SOL and SPL token send intents, the agentic User-Agent, the app.agents frontend
links, relay channels kept open past the idle timeout, cross-realm request headers, and
malformed enrollment and recovery link issues with exported name and description limits).

SHA-256:

```text
0c3ead733845cee2a13a76c30e4130b938f52c2c458412bc7a9d5d53bfe4dad6
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
