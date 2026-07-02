/**
 * REPRO — the worker wedges while GATHERING ARTIFACTS after a hook failure.
 *
 * This targets the actual mechanism behind the 120-min shard timeout, which is
 * distinct from the two other repros in this folder:
 *   - [connectionLoss.spec.ts]  the app vanishes → "can't seem to connect" (fast fail)
 *   - [seedingHang.spec.ts]     a seeding CLI call never settles → 300s hook timeout
 * The seeding stall is only the *trigger*: jest's `testTimeout` DOES fire on it and
 * emits a `hook_failure`. The *wedge* is what happens next — `jest.environment.ts`'s
 * `handleTestEvent("hook_failure")` runs `captureFailureDiagnostics()`, which pulls
 * device logs / screenshot / view hierarchy from the app and logs/screenshot from the
 * remote Speculos. When those endpoints are dead (OOM/jetsam kill, or a stalled remote
 * that also killed the seeding), any *unbounded* capture call hangs forever, so the
 * worker never finishes reporting the failure and the shard sits until the CI job's
 * wall-clock timeout. This is the class of bug PR #18031 ("Hook Error Artifact
 * Gathering Fix") and the `utils/withTimeout.ts` wrapping in `captureFailureDiagnostics`
 * were added to close.
 *
 * HOW THIS REPRODUCES IT DETERMINISTICALLY:
 *   1. the app is healthy (a normal interaction round-trips to it),
 *   2. we SIGKILL it out from under Detox (`killApp`) so every subsequent capture call
 *      hits a dead endpoint — Detox is never told, exactly like an OOM kill,
 *   3. we throw inside `beforeAll` to force a `hook_failure`, so the environment runs
 *      the full artifact-gathering path against the dead app.
 *
 * WHAT THE OUTCOME TELLS YOU:
 *   - Fast, labelled `beforeAll` failure  → every capture path is `withTimeout`-bounded;
 *     the wedge is fixed on this branch.
 *   - Indefinite hang (no report)         → a capture path is still unbounded. The prime
 *     suspect is Detox's own artifact plugin invoked via `super.handleTestEvent`
 *     (detox-allure2-adapter `deviceLogs: true`), which our `withTimeout` does not wrap.
 *
 * SAFE BY DEFAULT: `describe.skip` unless enabled (see gate below), so it never kills
 * the app in normal / scheduled shards. shard-tests.mjs content-matches the marker, so
 * filtering to @repro-artifact-hang runs this file alone.
 *
 * Run locally (iOS) — either enable var works:
 *   E2E_REPRO_ARTIFACT_HANG=1 pnpm detox test -c ios.sim.debug artifactHang.spec.ts
 *   INPUTS_TEST_FILTER=@repro-artifact-hang pnpm e2e:mobile test:ios --retries 0 artifactHang.spec
 *
 * marker tag: @repro-artifact-hang
 */
import { killApp } from "../../helpers/commonHelpers";

const ENABLED =
  (process.env.INPUTS_TEST_FILTER ?? "").includes("repro-artifact-hang") ||
  process.env.E2E_REPRO_ARTIFACT_HANG === "1";
const suite = ENABLED ? describe : describe.skip;

suite("@repro-artifact-hang — a worker wedges gathering artifacts after a hook failure", () => {
  beforeAll(async () => {
    // The app is healthy here: a normal interaction round-trips to it.
    await app.mainNavigation.expectPortfolioPageVisible();

    // Kill the app process uncatchably (OOM/jetsam-style). Detox is not notified, so
    // every artifact-gathering call below will hit a dead endpoint.
    await killApp();

    // Force a hook_failure so captureFailureDiagnostics() runs against the dead app.
    // If any capture path is unbounded, the worker wedges here like the CI shard.
    throw new Error("[repro-artifact-hang] forcing hook_failure with the app killed");
  });

  it("never runs: the failure-artifact gathering runs against the dead app", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
  });
});
