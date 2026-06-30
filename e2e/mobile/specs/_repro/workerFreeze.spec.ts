/**
 * CI HANG REPRODUCTION — frozen Jest worker (iOS E2E shard-5 timeout investigation).
 *
 * Reproduces the failure mode behind the shard-5 timeout: when a Detox jest
 * worker's event loop stops advancing, every timer that could end the run lives
 * on that same frozen loop — jest's `testTimeout` (300s), the global `beforeAll`
 * timeout (150s) and Detox's `setupTimeout` (500s) all silently fail to fire.
 * The parent jest process then waits on the dead worker forever, and `--forceExit`
 * never triggers (the run never "completes"). Only an EXTERNAL kill ends it — in
 * CI, the step's `timeout-minutes` (the original incident hung ~57 min idle until
 * the 69-minute step timeout).
 *
 * SAFE BY DEFAULT: this suite is `describe.skip` in normal/scheduled runs (so it
 * never launches the app and adds ~0 runtime). It only activates when the
 * dispatched `test_filter` selects it — i.e. when INPUTS_TEST_FILTER contains the
 * marker below. shard-tests.mjs matches this file because its content contains the
 * marker string, so filtering to it runs this file alone.
 *
 * HOW TO RUN ON CI:
 *   Dispatch "[Mobile] - E2E Only - Scheduled/Manual" with:
 *     ref         = <your branch>
 *     tests_type  = iOS Only   (or Android Only)
 *     test_filter = @repro-worker-freeze
 *   Expected: the shard hangs (no test result, no "Force exiting" log) and is
 *   killed by the step `timeout-minutes`. A watchdog fix must instead kill it in
 *   minutes — this spec doubles as the regression guard for that fix.
 *
 * Optional: set E2E_REPRO_FREEZE_MS to bound the freeze (faster feedback). Unset
 * = block indefinitely (faithful hang).
 *
 * marker tag: @repro-worker-freeze
 */
const FREEZE = (process.env.INPUTS_TEST_FILTER ?? "").includes("repro-worker-freeze");
const FREEZE_MS = Number(process.env.E2E_REPRO_FREEZE_MS) || 0;

const ts = () => new Date().toISOString();
const suite = FREEZE ? describe : describe.skip;

suite("@repro-worker-freeze — frozen jest worker (CI hang repro)", () => {
  it("freezes the worker event loop so jest's testTimeout cannot fire", () => {
    console.log(
      `[REPRO ${ts()}] worker pid=${process.pid} — freezing event loop` +
        (FREEZE_MS ? ` for ${FREEZE_MS}ms` : " indefinitely"),
    );
    // Atomics.wait blocks the worker's main thread synchronously. While blocked,
    // no timer (including jest's testTimeout) can run, so the run hangs until an
    // external kill. With no timeout arg, it never returns.
    const sab = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(sab, 0, 0, FREEZE_MS || Infinity);
    console.log(`[REPRO ${ts()}] event loop unblocked (only if E2E_REPRO_FREEZE_MS was set)`);
  });
});
