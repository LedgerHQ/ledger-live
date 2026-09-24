# Shared test infrastructure

Tests live next to the code they validate — a command's tests sit beside the
command, a module's unit tests beside the module. This directory holds only the
infrastructure they use, plus the test of `cli-runner`'s HTTP redirection.
Nothing here is reachable from `src/cli.ts`, so none of it is compiled into the
binary.

| Helper | What it provides |
|--------|-----------------|
| `cli-runner` | Runs a command in-process, as if spawned (`runCli`) |
| `mock-server` | Serves canned HTTP routes on a local port |
| `session-fixture` | Temp XDG state dir pre-populated with session entries |
| `constants`, `cal-fixtures`, `eth-sync-routes` | Fixed addresses, descriptors, token info and sync routes |
| `auth-routes`, `swap-quote-routes` | Keycloak + LKRP auth routes, and swap API routes recording each quote's `authorization` header |
| `authenticated-quote-server` | Both of the above behind one server, with a helper that runs `swap quote` and returns its signed challenge |
| `human-device-error-exit` | Standalone script spawned to assert human-output exit codes |

## Contract tests

Tests that drive the CLI through `runCli` carry a `.contract.test.ts` suffix to
set them apart from unit tests. Each treats the CLI as a black box: given known
flags and mocked infrastructure, it must produce the expected output and exit
code. A test that calls a command's function directly is a unit test and keeps
the plain `.test.ts` suffix.

All external I/O is replaced — no real device or network needed:

| Layer | What it replaces | How |
|-------|-----------------|-----|
| `MockServer` | Outbound `fetch` / axios / `http(s).request` calls | `runCli` with `WALLET_CLI_MOCK_PORT=<n>` redirects them to the server |
| `MockDeviceManagementKit` | USB Ledger device (DMK) | `runCli` with `WALLET_CLI_MOCK_DMK=1` installs a mock transport; coin results come from `WALLET_CLI_MOCK_APP_RESULTS` (JSON) |

## Running

```sh
pnpm test                          # everything: bun test src/ scripts/
bun test src/commands/             # every command's tests
bun test src/commands/swap/        # one command group
```

`scripts/` is part of the run because the skills codegen tests live beside the
build scripts they exercise.
