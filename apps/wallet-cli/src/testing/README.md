# Shared test infrastructure

Tests live next to the code they validate — a command's tests sit beside the
command, a module's unit tests beside the module. This directory holds only the
infrastructure they use, plus `cli-runner`'s own test.
Nothing here is reachable from `src/cli.ts`, so none of it is compiled into the
binary.

| Helper | What it provides |
|--------|-----------------|
| `cli-runner` | Runs a command in-process, as if spawned (`runCli`) |
| `mock-server` | Serves canned HTTP routes on a local port |
| `session-fixture` | Temp state dir pre-populated with session entries, or a session file under a given one (`writeSessionIn`) |
| `state-home` | Points the CLI state dir at a temp dir, Windows included (`pointStateHomeAt`), and the CLI state dir under a temp one (`cliStateDirIn`) |
| `symlinks` | Links a directory as a junction on Windows, which needs no symlink rights (`linkDirectory`), and whether this host can create file symlinks (`canSymlinkFiles`: not on Windows without admin rights or Developer Mode) |
| `constants`, `cal-fixtures`, `eth-sync-routes` | Fixed addresses, descriptors, token info and sync routes |
| `auth-routes`, `swap-quote-routes` | Keycloak + LKRP auth routes, and swap API routes recording each quote's `authorization` header |
| `agent-intent-service` | The Agent Intent service and its sign-in as routes, answering each endpoint what the test scripted and recording requests and verified sign-ins (`FakeAgentIntentService`), an intent as the service returns it (`intentRecord`), and a state dir with an enrolled profile whose agent key sits in an `InMemoryKeychain` (`makeEnrolledProfile`) |
| `fake-confirm-prompt` | Yes/no prompt fake for `_setTestConfirmPrompt` that records each question |
| `agent-intent-proposals` | What `send`/`swap` submitted, signature checked (`submittedIntents`), CAL token routes that record ticker searches (`FakeCal`), the Solana node's mint program (`solanaMintsRoute`), and Swap API quotes (`FakeSwapQuotes`, `quoteRow`) |
| `agent-intent-cal-routes` | CAL routes that know USDC on Ethereum and Solana and no other token (`CAL_KNOWS_USDC`, `USDC_CONTRACT`, `USDC_MINT`, `USDC_ID`) |
| `agent-intent-profile-records` | An Agent Intent profile as `session.yaml` stores it (`profileRecord`), and a state dir holding such records, valid or not, with no agent key (`makeProfilesDir`) |
| `agent-sign-in` | Wraps `FakeAgentIntentService.routes` to record where each sign-in starts and refuse the token exchange, as for an agent key outside the Trustchain (`AgentSignIn`) |
| `fake-relay` | The enrollment and recovery channel for `_setTestRelayChannelHost`: the SDK's real relay host on in-memory sockets, with the web app's side played by the SDK (`FakeRelay`) |
| `fake-ledger-sync` | Ledger Sync as an agent sees it, for `_setTestAgentLedgerSyncSdk`: restores the Trustchain or fails, grants a permission (`grant`), and serves encrypted Cloud Sync accounts (`FakeLedgerSync`, `syncedDocument`) |
| `fake-detach` | Listener starter for `_setTestSpawn`: writes scripted lines to the real log, records argv and env, exits or keeps running (`FakeListenerSpawner`) |
| `cal-cache` | A fresh CAL token cache for each test, so tokens other files resolved don't leak in (`useFreshCalCache`) |
| `sigint` | Runs a CLI run the test interrupts with Ctrl+C without firing other files' SIGINT listeners (`withOwnSigint`) |
| `authenticated-quote-server` | Both of the above behind one server, with a helper that runs `swap quote` and returns its signed challenge |
| `human-device-error-exit` | Standalone script spawned to assert human-output exit codes |
| `output-loads-solana-sdk` | Standalone script spawned to assert that loading `output.ts` leaves the Solana SDK unloaded |
| `print-swap-api-base` | Standalone script spawned to assert which Swap API URL startup leaves for live-common |
| `os-keychain` | A failing Linux Secret Service probe, and a `process.platform` override |
| `in-memory-keychain` | OS keychain fake for `_setTestKeychain` |
| `fake-spinner` | Spinner fake for `_setTestSpinner` that records what it shows |
| `gated-module-mock` | Module mock that other test files can't see (`createGatedModuleMock`) |
| `clear-shell-env` | Test preload (`bunfig.toml`) that drops `SPECULOS_*` and `SWAP_API_BASE` from the shell or `.env`, so tests don't pick the Speculos transport or another Swap API |
| `skill-fixtures` | Reads an installed skill's files and rewrites its sidecar, e.g. as an older wallet-cli would have |

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
| Temp state dir | `session.yaml` and the rest of the state dir | `runCli` gives each run an empty one unless the test passes `XDG_STATE_HOME` (e.g. `makeSessionDir`) |

## Test doubles

`bun test` runs every file in one process, and `mock.module` replaces a module
for all of them until the process ends; `mock.restore()` does not undo it. Pick
the first option that works:

1. **Parameter** — the code takes the dependency with the real one as default,
   e.g. `executeSwapCommand({ runFullSwapPipeline })`, `startAnalytics(createClient)`.
2. **Test seam** — when the test can't pass the dependency in (e.g. code reached
   through `runCli`), an `@internal` `_setTest*` setter (`_setTestKeychain`,
   `_setTestLkrpSdk`, `_setTestAgentLedgerSyncSdk`, `_setTestGenuineCheck`,
   `_setTestSpinner`, `_setTestDmkTransport`, `_setTestDmk`,
   `_setTestConfirmPrompt`, `_setTestRelayChannelHost`, `_setTestSpawn`,
   `_setTestStartupTimeoutMs`, `_setTestPollSleep`), built with `createTestSeam`
   (`shared/test-seam.ts`). Set it in `beforeAll`/`beforeEach` and call
   `resetTestSeams()` in the matching `after*` hook, which restores every seam.
   Files using `makeEnrolledProfile` reset only the seams they set instead:
   `resetTestSeams()` would also remove the fixture's keychain.
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
