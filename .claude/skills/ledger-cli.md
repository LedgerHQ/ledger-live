# ledger-cli

Run the new `ledger-cli` power-user CLI directly from the monorepo root.

## Usage

The user invokes `/ledger-cli <args>` — pass the args as-is to the CLI binary.

## Instructions

Run the following command from the monorepo root and show the full output:

```bash
pnpm ledger-cli $ARGS
```

Where `$ARGS` are the arguments provided by the user (e.g. `--help`, `balance "js:2:ethereum:0xABC::"`, `discover-accounts --currency bitcoin --format json`).

If no args are provided, run `pnpm ledger-cli --help`.

Show the raw output to the user. If the command fails, show the error and suggest fixes (e.g. rebuild with `pnpm ledger-cli:run build` if the binary is stale, or rebuild deps with `pnpm turbo build --filter=@ledgerhq/cryptoassets`).
