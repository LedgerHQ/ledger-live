/**
 * REPRO — a worker wedges during account seeding and hangs the whole shard.
 *
 * This is the shard-TIMEOUT signature (distinct from the connection-loss one in
 * [connectionLoss.spec.ts]): NOT "The app has crashed" / "unexpectedly disconnected",
 * but *silence*. A spec's `beforeAll` calls `app.init(...)`, which seeds accounts by
 * running `ledger-live` CLI commands (`liveData` / `getAddress`) against a remote
 * Speculos. Those calls are awaited via `lastValueFrom(observable)` in
 * `utils/initUtil.ts#executeCliCommand` with NO timeout, and the surrounding retry
 * loops only re-run on *rejection*, never on a *hang*. So when a remote-Speculos
 * command accepts but then stalls and never completes, the await never settles:
 *   - the worker emits no further output ("Speculos is ready…" then nothing),
 *   - the single unreported spec is the wedged one,
 *   - and the shard sits until the CI job's wall-clock timeout ("timed out after
 *     120 minutes"), taking every other worker's results down with it.
 *
 * Observed in the wild on iOS shards seeding swap specs (many accounts → many CLI
 * calls → higher odds one stalls), e.g. swapETH_BTC_NATIVE_SEGWIT_10000NotEnoughFee
 * and swapSeeHistoryOperations.
 *
 * HOW THIS REPRODUCES IT DETERMINISTICALLY: instead of waiting for a real remote
 * Speculos to stall, we feed `app.init` a `cliCommand` that returns a never-resolving
 * Promise. It flows through the exact production path — `executeCliCommands` →
 * `executeCliCommand` — where `await cmd(...)` never settles, reproducing the wedge
 * every run. No Speculos is launched (no `speculosApp` / `cliCommandsOnApp`), so the
 * repro is self-contained.
 *
 * (An earlier version returned rxjs `NEVER`; under the SWC transform that constant can
 * resolve to `undefined`, making the command a silent no-op — hence a native
 * never-resolving Promise, which hangs at `await cmd(...)` regardless of rxjs.)
 *
 * WHAT A FIX SHOULD DO: wrap the seeding calls in `executeCliCommand` with
 * `utils/withTimeout.ts` (rethrow on timeout) so a stalled command rejects and the
 * existing retry/Speculos-recreation logic kicks in. With that fix in place this repro
 * flips from an indefinite hang to a fast, clearly-labelled `beforeAll` failure.
 *
 * SAFE BY DEFAULT: `describe.skip` unless the dispatched test_filter selects it (i.e.
 * INPUTS_TEST_FILTER contains the marker below), so it never wedges normal / scheduled
 * shards. shard-tests.mjs content-matches the marker, so filtering to
 * @repro-seeding-hang runs this file alone.
 *
 * Run locally (iOS) — either enable via the CI filter var or the local convenience var:
 *   E2E_REPRO_SEEDING_HANG=1 pnpm detox test -c ios.sim.debug seedingHang.spec.ts
 *   INPUTS_TEST_FILTER=@repro-seeding-hang pnpm e2e:mobile test:ios --retries 0 seedingHang.spec
 *
 * marker tag: @repro-seeding-hang
 */
import { log } from "detox";

const ENABLED =
  (process.env.INPUTS_TEST_FILTER ?? "").includes("repro-seeding-hang") ||
  process.env.E2E_REPRO_SEEDING_HANG === "1";
const suite = ENABLED ? describe : describe.skip;

suite("@repro-seeding-hang — a worker wedges during account seeding", () => {
  beforeAll(async () => {
    // Routes through executeCliCommand, where `await cmd(...)` awaits this
    // never-resolving Promise: the unbounded await that hangs the worker exactly
    // like a stalled remote-Speculos seeding command. The log line proves the path
    // is reached (if it prints and the run then wedges, the repro fired).
    await app.init({
      userdata: "skip-onboarding",
      cliCommands: [
        () => {
          log.warn("[repro-seeding-hang] entering never-resolving seeding command");
          return new Promise<never>(() => {});
        },
      ],
    });
  });

  it("never runs: the shard hangs in beforeAll until the CI job wall-clock timeout", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
  });
});
