/**
 * REPRO — Detox loses connection with the app ("can't seem to connect to the test app(s)").
 *
 * Reproduces the CI signature where the app vanishes out from under Detox: an
 * uncatchable SIGKILL (an OOM / jetsam kill in the wild) drops the app<->Detox
 * websocket with NO signal for Detox's in-app crash handler to catch. Detox is never
 * told, so it does not relaunch, and the next interaction fails with:
 *   - "The app has unexpectedly disconnected from Detox server"
 *   - "Detox can't seem to connect to the test app(s)!" / "package could not be delivered"
 * This is the shard-5 signature — distinct from "The app has crashed" (a caught crash,
 * e.g. a SIGSEGV/SIGABRT) and "The app is busy" (a frozen JS thread that stays connected).
 *
 * SAFE BY DEFAULT: `describe.skip` unless the dispatched test_filter selects it (i.e.
 * INPUTS_TEST_FILTER contains the marker below), so it never kills the app in normal /
 * scheduled shards. shard-tests.mjs content-matches the marker, so filtering to
 * @repro-connection-loss runs this file alone.
 *
 * Run locally (iOS):
 *   INPUTS_TEST_FILTER=@repro-connection-loss pnpm e2e:mobile test:ios --retries 0 connectionLoss.spec
 *
 * marker tag: @repro-connection-loss
 */
import { killApp, delay } from "../../helpers/commonHelpers";

const ENABLED = (process.env.INPUTS_TEST_FILTER ?? "").includes("repro-connection-loss");
const suite = ENABLED ? describe : describe.skip;

suite("@repro-connection-loss — Detox loses connection with the app", () => {
  beforeAll(async () => {
    await app.init({ userdata: "skip-onboarding" });
  });

  it("reports 'unexpectedly disconnected' after the app is SIGKILLed out from under Detox", async () => {
    // The app is healthy here: a normal interaction round-trips to it.
    await app.mainNavigation.expectPortfolioPageVisible();

    // Kill the app process uncatchably (OOM/jetsam-style). Detox is not notified.
    await killApp();
    await delay(1000);

    // Any interaction now hits a dead websocket -> the CI connection-loss error.
    let error: unknown;
    try {
      await app.mainNavigation.expectPortfolioPageVisible();
    } catch (e) {
      error = e;
    }
    expect(String(error)).toMatch(/unexpectedly disconnected|can't seem to connect/i);
  });
});
