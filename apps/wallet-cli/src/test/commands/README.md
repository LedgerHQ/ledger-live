# Command contract tests

Each test treats a CLI command as a black box: given known flags and mocked
infrastructure, the command must produce the expected stdout shape (JSON envelope)
and exit code.

All external I/O is replaced — no real device or network needed:

| Layer | What it replaces | How |
|-------|-----------------|-----|
| `MockServer` | Ledger Explorer HTTP API | `WALLET_CLI_MOCK_PORT=<n>` redirects all HTTP calls |
| `MockDeviceManagementKit` | USB Ledger device (DMK) | `WALLET_CLI_MOCK_DMK=1` installs a mock transport; coin results come from `WALLET_CLI_MOCK_APP_RESULTS` (JSON) |

Run with `bun test src/test/commands/`.
