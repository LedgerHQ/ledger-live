import { UnservableSlicesError } from "./errors";
import { planFetch } from "./router";
import { fakeSource, makeRef } from "./port.mock";

const ref = makeRef();

const a4 = () => fakeSource({ id: "a4", priority: 20, capabilities: ["balance", "operations"] });
const coinModule = () =>
  fakeSource({ id: "coin-module-api", priority: 10, capabilities: ["balance", "core"] });
// The legacy fan-out: nothing served independently, everything produced as a side effect of running.
const legacy = () =>
  fakeSource({
    id: "legacy-bridge",
    priority: 0,
    capabilities: [],
    deliveries: ["core", "balance", "operations", "balanceHistory", "staking", "resources"],
  });

describe("planFetch", () => {
  it("picks the highest-priority source that can serve the slice", () => {
    const plan = planFetch(ref, new Set(["balance"]), [legacy(), coinModule(), a4()]);
    expect(plan).toHaveLength(1);
    expect(plan[0].source.id).toBe("a4");
    expect(plan[0].slices).toEqual(["balance"]);
  });

  it("falls back to the next source when the cheapest one does not support the ref", () => {
    const plan = planFetch(ref, new Set(["balance"]), [
      fakeSource({ id: "a4", priority: 20, capabilities: ["balance"], supports: false }),
      coinModule(),
    ]);
    expect(plan.map(leg => leg.source.id)).toEqual(["coin-module-api"]);
  });

  it("never selects a source whose capability set is empty", () => {
    const plan = planFetch(ref, new Set(["balance"]), [legacy(), coinModule()]);
    expect(plan.map(leg => leg.source.id)).toEqual(["coin-module-api"]);
  });

  it("uses the empty-capability source as the fallback for what nothing else covers", () => {
    const plan = planFetch(ref, new Set(["resources"]), [legacy(), coinModule()]);
    expect(plan).toEqual([
      { source: expect.objectContaining({ id: "legacy-bridge" }), slices: ["resources"] },
    ]);
  });

  it("collapses to a single legacy sync when a legacy-only slice is also wanted", () => {
    // The load-bearing case: subtracting deliveries (not capabilities) means the granular leg for
    // `balance` is dropped, because the sync it has to run for `resources` produces it anyway.
    const plan = planFetch(ref, new Set(["balance", "resources"]), [legacy(), coinModule()]);
    expect(plan).toHaveLength(1);
    expect(plan[0].source.id).toBe("legacy-bridge");
    expect(plan[0].slices).toEqual(["resources"]);
  });

  it("splits across sources when neither can cover the other's slice", () => {
    const plan = planFetch(ref, new Set(["balance", "core"]), [
      fakeSource({ id: "a4", priority: 20, capabilities: ["balance"] }),
      fakeSource({ id: "coin-module-api", priority: 10, capabilities: ["core"] }),
    ]);
    expect(plan.map(leg => [leg.source.id, leg.slices])).toEqual([
      ["a4", ["balance"]],
      ["coin-module-api", ["core"]],
    ]);
  });

  it("drops a cheaper leg when a source that must run anyway already covers it", () => {
    // `core` forces the coin-module leg, and that leg delivers `balance` too — so paying A4 for a
    // balance that is already on its way would be pure waste, even though A4 is the cheaper source.
    const plan = planFetch(ref, new Set(["balance", "core"]), [
      fakeSource({ id: "a4", priority: 20, capabilities: ["balance"] }),
      coinModule(),
    ]);
    expect(plan.map(leg => leg.source.id)).toEqual(["coin-module-api"]);
  });

  it("does not re-request a slice a higher-priority leg already over-delivers", () => {
    const plan = planFetch(ref, new Set(["balance", "operations"]), [coinModule(), a4()]);
    expect(plan.map(leg => leg.source.id)).toEqual(["a4"]);
    expect(plan[0].slices.sort()).toEqual(["balance", "operations"]);
  });

  it("returns an empty plan for an empty demand", () => {
    expect(planFetch(ref, new Set(), [legacy(), a4()])).toEqual([]);
  });

  it("throws when nothing can cover the remainder", () => {
    expect(() => planFetch(ref, new Set(["resources"]), [coinModule()])).toThrow(
      UnservableSlicesError,
    );
  });

  it("names the unservable slices on the error", () => {
    try {
      planFetch(ref, new Set(["staking", "resources"]), [coinModule()]);
      throw new Error("expected planFetch to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(UnservableSlicesError);
      expect([...(error as UnservableSlicesError).slices].sort()).toEqual(["resources", "staking"]);
    }
  });
});
