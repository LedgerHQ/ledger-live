# Stall watchdog

How a frozen jest worker is turned into a failed, retried spec instead of a shard that hangs until
the CI step times out ([QAA-1365](https://ledgerhq.atlassian.net/browse/QAA-1365)).

## Why it exists

When a worker's event loop stops advancing, every timeout that could end the run lives on that same
loop: jest's `testTimeout`, the `beforeAll` timeout in `setup.ts`, Detox's `setupTimeout`. None of
them fire, and the jest parent waits on the worker forever. jest does not detect stuck workers
([jestjs/jest#13864](https://github.com/jestjs/jest/issues/13864)) but handles dead ones
([#13566](https://github.com/jestjs/jest/pull/13566)), so the watchdog turns "stuck" into "dead".

## How it works

1. **Arm.** `setup()` in `jest.environment.ts` calls `armWorkerWatchdog()` first, so device
   allocation and app install are watched too. Only forked workers arm: in-band, the process is the
   whole run, and killing it would lose Detox's cleanup.
2. **Beat.** The worker's main thread beats every second through
   [`@sentry/node-native-stacktrace`](https://www.npmjs.com/package/@sentry/node-native-stacktrace),
   carrying the current spec and phase. It beats for the worker's whole life, idle included.
3. **Watch.** `helpers/workerWatchdog.thread.cjs` runs on its own thread and event loop. After 90s
   without a beat it captures the frozen stack, writes `artifacts/stall-watchdog-<pid>.json`,
   prints a `::error::[stall-watchdog]` annotation and SIGKILLs the worker.
4. **Retry.** jest fails the spec ("A jest worker process was terminated") and Detox's `--retries`
   re-runs it.
5. **Release the Speculos.** A killed worker never reaches the teardown that releases its devices.
   `jest.globalTeardown.ts` releases those listed in the tracking files
   (`artifacts/speculos-instances.<pid>.json`) of dead workers, before the retry acquires more. The
   controller's signal handler (`jest.globalSetup.ts`) releases every worker's.
6. **Reclaim the device.** Each worker is pinned to its own simulator or AVD, and an in-band retry
   always asks for worker 1's. `patches/detox@20.51.3.patch` records the worker's pid as the
   device's owner and reuses a device whose owner is dead, on iOS and Android.
7. **Report.** `jest.config.js` rewrites the killed file's Allure result: the message names the
   frozen phase, the trace holds the frozen frames, and it gets `tag: stall-watchdog` and `host`.
   It does so only when the report names that spec, so an OOM or runner kill keeps jest's message.

## Phases

The phase is what the worker last started (`watchdogPhase()` in `helpers/workerWatchdog.ts`):

| Label | Running |
| --- | --- |
| `environment setup` | Detox device allocation and app install |
| `beforeAll (setup.ts)`, `afterAll (setup.ts)` | the global hooks |
| `beforeAll in '<describe>'`, `afterAll in '<describe>'` | a describe block's hooks |
| `beforeEach: <test>`, `afterEach: <test>` | a test's hooks |
| `test: <test>` | the test body |
| `done: <test>` | after a test, until the next event |
| `teardown`, `idle` | environment teardown, and between spec files |

## Traps

- `threadPoll(true, state)`: the first argument enables tracking. `false` silently disables it.
- A beat tied to each spec's lifecycle false-kills idle workers and misses a freeze before the
  first beat, so the heartbeat runs for the worker's whole life.
- The watchdog never breaks a suite: the native module is loaded lazily, and any failure of its own
  logs `[stall-watchdog] disabled: …` and leaves the run unwatched. The thread's `error` listener
  is required: without it, a thread error crashes the worker it protects.
- A thread's `console` goes through the frozen main thread, so the thread writes to fd 2.
- A thread blocked in native code (`execSync`, a syscall) is detected but has no JS frames.
- Log with `warn`: CI runs Detox with `--loglevel warn`, which hides `info`.

## Local use

In-band runs (the local default, `maxWorkers: 1`) are never watched. With `--maxWorkers=2` or more,
a worker paused in a debugger for over 90s is killed like a frozen one:
`export E2E_STALL_WATCHDOG=0` turns the watchdog off.

To reproduce a freeze, send the worker `SIGUSR1` to open its inspector on port 9229, then evaluate
an `Atomics.wait` through `Runtime.evaluate`. `SIGSTOP` cannot test it: it stops the watchdog
thread too.
