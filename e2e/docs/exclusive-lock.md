# Exclusive lock

How E2E tests on every CI machine (desktop legs, iOS and Android shards, and their workers) take
turns on the shared QAA accounts and on shared state such as the Pay card. Two broadcasts from one
account at once reuse its nonce or UTXOs, and one is rejected. The lock lives in
`libs/live-e2e-shared/src/exclusiveLock.ts`.

## Declare what a test broadcasts from

What to declare: [E2E conventions](e2e-conventions.md#tests-must-declare-what-they-broadcast-from-or-change). How:
[Mobile](../mobile/docs/e2e-mobile-conventions.md#exclusive-lock-implementation) and
[Desktop](../desktop/docs/e2e-desktop-conventions.md#exclusive-lock-implementation).

| Target | Mobile | Desktop | Locked |
| --- | --- | --- | --- |
| Account the app broadcasts from | `declareBroadcastAccounts` | `broadcastAccounts` | When the app broadcasts |
| Account a CLI command broadcasts from | `declareCliBroadcastAccounts` | `cliBroadcastAccounts` | Every run |
| Shared state, e.g. `PAY_CARD` | `declareSharedResources` | `sharedResources` | Every run |

The app broadcasts on mobile unless `DISABLE_TRANSACTION_BROADCAST` is set, and on desktop when it
is `0`. CI turns it on for the Monday desktop nightly, the Wednesday iOS nightly, the Friday
Android nightly, and `enable_broadcast` runs. CLI token approvals broadcast whatever the flag says.

## How it works

1. **Key.** `<currency id>:<account path>` of the account, or of its parent for a token account.
   `PAY_CARD` uses `pay-card`. A holder of several keys takes them in sorted order, so two holders
   never deadlock.
2. **When.** Mobile locks in `setup.ts` before the app starts and holds the lock for the whole spec
   file. Desktop locks in the automatic `exclusiveLock` fixture, before Speculos and the app, for
   each test.
3. **Store.** Each key is one object under `e2e-broadcast-locks/` in the `ledger-live-cache` R2
   bucket. Claims are conditional writes on the object's ETag. The record names the holder
   (`host:pid:uuid`) and a label (platform, spec and test).
4. **Lease.** The holder renews its 120 s lease every 20 s. If a holder dies, its lease expires and
   a waiter takes the key over.
5. **Settle.** After a release, the key stays closed for 45 s, so the next holder reads a nonce
   that includes the last transaction. The settle window is skipped when nothing was broadcast,
   when the CLI waited for confirmation, or for shared state.
6. **Wait.** A waiter polls every 5–7.5 s for up to 30 min (`EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS`),
   then fails. When a settle window ends, the waiter that has waited longest claims first. If every
   R2 request fails for 2 min, it fails then with `ExclusiveLockStoreDownError`.
   With `E2E_EXCLUSIVE_LOCK_PRIORITY=high` (release and hotfix runs), a waiter polls every 1–1.5 s
   and claims within 1.5 s of a settle window's end, before the others, who claim 3.5–5 s after
   it. Each group still goes longest-waiting first. The others' delay shrinks as they wait, so
   after about 10 min they claim with high-priority waiters instead of after them. A
   high-priority waiter still waits for the current holder.
7. **Nesting.** A CLI approval inside a test that already holds the account joins that hold instead
   of waiting for it. The test's release waits for the approval to finish.
8. **Without R2.** If `E2E_EXCLUSIVE_LOCK_*` is unset, or `E2E_EXCLUSIVE_LOCK_MODE` is `local`, a
   file lock under `$TMPDIR/ll-e2e-locks` serializes processes on this machine only. On CI (`CI`
   set), only `local` allows it.

If a mobile spec cannot get its lock, its tests fail. Its other hooks still run, so the app starts
with broadcast disabled, and any later lock on those keys in the spec fails at once.

## Deferral passes

Pass 1 tries each lock without waiting. When a lock is busy, the test (desktop) or spec file
(mobile) is skipped, and a later pass runs it again. After `E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES`
passes (default 2), the next pass waits for busy locks.

- **Desktop.** `pnpm e2e:desktop test:playwright` runs `scripts/playwrightWithDeferrals.mjs`. The
  `lockDeferralReporter` lists the deferred tests, and the next pass selects them with
  `--test-list`. The script drops their skipped results from Allure, prints the totals of all
  passes, and merges `.last-run.json`. `--ui`, `--debug` and `--list` run Playwright directly, and
  `--repeat-each` turns deferral off.
- **Mobile.** `apps/ledger-live-mobile/scripts/e2e-ci.mjs` runs the passes. At `run_start`,
  `jest.environment.ts` skips the deferred file and leaves a marker in
  `artifacts/lock-deferrals`. `jest.config.js` drops the file's results from Allure. The time
  each spec waited for its locks is left out of the shard timings. Mock runs do not defer.
- Retries (Playwright `retry > 0`, Detox `--retries`) never defer; they wait.
- Without R2, a lock never counts as busy, so local runs wait instead of deferring.

## CI

| Variable | Set by |
| --- | --- |
| `E2E_EXCLUSIVE_LOCK_ENDPOINT`, `_BUCKET`, `_ACCESS_KEY_ID`, `_SECRET_ACCESS_KEY` | The workflows, from the `R2_*` secrets. Set all four or none. Desktop removes them from the app's env |
| `E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES` | The `lock_deferral_passes` workflow input |
| `E2E_EXCLUSIVE_LOCK_DEFER` | The pass runners, on each pass. Do not set it |
| `E2E_EXCLUSIVE_LOCK_MODE` | The `exclusive_lock` workflow input: `remote` (default) or `local` |
| `E2E_EXCLUSIVE_LOCK_PRIORITY` | The workflows: `high` when the ref under test is `release` or `hotfix`, otherwise `normal` |

While R2 is down, dispatch with `exclusive_lock: local`. Each machine still keeps its own tests
apart, but CI machines no longer keep each other away.

Every run gets time for one full lock wait, since a run without broadcast still locks the Pay card
and CLI approval accounts. The iOS step's timeout includes 30 extra minutes (60 to 120 min, 120 on
a broadcast run), and the desktop test step gets 70 min. Android's 90 min already covers it. The
timeout is on the test step, so the results finished before it are still uploaded. Desktop
broadcast runs share the `desktop-e2e-broadcast` concurrency group, so two never overlap.

## Reading the logs

Every line starts with `[exclusiveLock]` and is logged with `console.warn`, because Detox on CI
hides `info`.

| Line or error | Meaning |
| --- | --- |
| `waiting for "<key>", held by <holder> (<label>)` | Another test holds the key. The label names it |
| `moved to a later pass` | Deferred. The test runs again in the next pass |
| `took over "<key>" … its lease expired` | The previous holder died or stalled for over 120 s |
| `ExclusiveLockLostError` | This holder stalled past its lease, so broadcasts may have overlapped |
| `ExclusiveLockBusyError` | Waited 30 min without getting the key |
| `ExclusiveLockRefusedError` | Mobile: the spec's own lock failed earlier |
| `ExclusiveLockConfigError` | `E2E_EXCLUSIVE_LOCK_*` is missing on CI, or only partly set |
| `ExclusiveLockStoreFatalError` | R2 rejected the request in a way retrying cannot fix |
| `ExclusiveLockStoreDownError` | Every R2 request failed for 2 min. Rerun with `exclusive_lock: local` |
