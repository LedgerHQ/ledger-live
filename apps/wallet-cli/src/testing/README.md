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
| `in-memory-keychain` | OS keychain fake for `_setTestKeychain` |
| `fake-spinner` | Spinner fake for `_setTestSpinner` that records what it shows |
| `gated-module-mock` | Module mock that other test files can't see (`createGatedModuleMock`) |

## CLI tests

Tests that drive the CLI through `runCli` carry a `.cli.test.ts` suffix to
set them apart from unit tests. Each treats the CLI as a black box: given known
flags and mocked infrastructure, it must produce the expected output and exit
code. A test that calls a command's function directly is a unit test and keeps
the plain `.test.ts` suffix.

All external I/O is replaced — no real device or network needed:

| Layer | What it replaces | How |
|-------|-----------------|-----|
| `MockServer` | Outbound `fetch` / axios / `http(s).request` calls | `runCli` with `WALLET_CLI_MOCK_PORT=<n>` redirects them to the server |
| `MockDeviceManagementKit` | USB Ledger device (DMK) | `runCli` with `WALLET_CLI_MOCK_DMK=1` installs a mock transport; coin results come from `WALLET_CLI_MOCK_APP_RESULTS` (JSON) |
| `InMemoryKeychain` | OS keychain | `runCli` uses its own unless the test installed one with `_setTestKeychain` |

## Test doubles

`bun test` runs every file in one process, and `mock.module` replaces a module
for all of them until the process ends; `mock.restore()` does not undo it. Pick
the first option that works:

1. **Parameter** — the code takes the dependency with the real one as default,
   e.g. `executeSwapCommand({ runFullSwapPipeline })`, `startAnalytics(createClient)`.
2. **Test seam** — for code reached through `runCli`, an `@internal` `_setTest*`
   setter (`_setTestKeychain`, `_setTestLkrpSdk`, `_setTestGenuineCheck`,
   `_setTestSpinner`, `_setTestDmkTransport`). Set it in `beforeAll`/`beforeEach`,
   pass `null` in the matching `after*` hook.
3. **Environment fake** — `MockServer` and `MockDeviceManagementKit` above.
4. **`spyOn`** — on a module namespace, restored in `afterEach` or `finally`.
5. **`createGatedModuleMock`** — when none of the above fits. It forwards to the
   real module unless the file activated its fakes (`beforeAll` / `afterAll`).

## Order independence

A test must not depend on another test or file having run first: set up its
own state (a file that needs live-common imports `live-common-setup`) and
restore whatever it changed.

## Running

```sh
pnpm test                          # everything: bun test src/ scripts/
bun test src/commands/             # every command's tests
bun test src/commands/swap/        # one command group
bun test src/ scripts/ --randomize # shuffled order; replay one with the --seed=N it prints
```

`scripts/` is part of the run because the skills codegen tests live beside the
build scripts they exercise.
