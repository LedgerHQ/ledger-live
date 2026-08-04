import type { ZodType } from "zod";
import type { CloudSyncDataManager } from "./index";

type Fixtures<LocalState, DistantState> = {
  /** A local state with no meaningful data (e.g. empty map/array/object) */
  emptyLocalState: LocalState;
  /** A local state with some meaningful data to exercise diff and convergence */
  nonEmptyLocalState: LocalState;
  /** Optional: a distant state known to match nonEmptyLocalState exactly */
  matchingDistantState?: DistantState;
};

/**
 * Runs a generic contract test suite for a CloudSyncDataManager implementation.
 * Import and call this inside a describe block in your cloudSyncModule.test.ts.
 *
 * Validates the following invariants:
 * - schema parses its own distant state output
 * - diffLocalToDistant(empty, null) yields hasChanges=false (nothing to sync from nothing)
 * - resolveIncrementalUpdate returns no changes when incomingState is null
 * - resolveIncrementalUpdate returns no changes when incomingState === latestState (same ref)
 * - diffLocalToDistant is stable: calling it again with its own output yields hasChanges=false
 * - idempotence: receiving back the distant state we produced causes no local changes (content equality)
 * - convergence: applying an incoming update makes the local state in sync with that distant state
 * - nextState is JSON-serializable and under 1MB
 * - diffLocalToDistant and applyUpdate complete within 5ms each (pure in-memory ops)
 */
export function describeCloudSyncModuleContract<
  LocalState,
  Update,
  Schema extends ZodType<DistantState>,
  DistantState,
>(
  label: string,
  module: CloudSyncDataManager<LocalState, Update, Schema, DistantState>,
  fixtures: Fixtures<LocalState, DistantState>,
): void {
  describe(label, () => {
    it("schema parses the distant state produced by diffLocalToDistant", () => {
      const { nextState: empty } = module.diffLocalToDistant(fixtures.emptyLocalState, null);
      expect(() => module.schema.parse(empty)).not.toThrow();

      const { nextState: nonEmpty } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      expect(() => module.schema.parse(nonEmpty)).not.toThrow();
    });

    it("diffLocalToDistant(empty, null) has no changes", () => {
      const { hasChanges } = module.diffLocalToDistant(fixtures.emptyLocalState, null);
      expect(hasChanges).toBe(false);
    });

    it("idempotence: receiving back the distant state we produced causes no local changes", async () => {
      const { nextState } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      const incomingCopy = module.schema.parse(nextState); // new object, same content
      const result = await module.resolveIncrementalUpdate(
        fixtures.nonEmptyLocalState,
        null,
        incomingCopy,
      );
      expect(result.hasChanges).toBe(false);
    });

    it("resolveIncrementalUpdate has no changes when incomingState is null", async () => {
      const r1 = await module.resolveIncrementalUpdate(fixtures.emptyLocalState, null, null);
      expect(r1.hasChanges).toBe(false);

      const r2 = await module.resolveIncrementalUpdate(fixtures.nonEmptyLocalState, null, null);
      expect(r2.hasChanges).toBe(false);
    });

    it("resolveIncrementalUpdate has no changes when incomingState is same reference as latestState", async () => {
      const { nextState } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      const result = await module.resolveIncrementalUpdate(
        fixtures.nonEmptyLocalState,
        nextState,
        nextState,
      );
      expect(result.hasChanges).toBe(false);
    });

    it("diffLocalToDistant is stable: re-diffing with own output yields hasChanges=false", () => {
      const { nextState } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      const rediff = module.diffLocalToDistant(fixtures.nonEmptyLocalState, nextState);
      expect(rediff.hasChanges).toBe(false);
    });

    it("convergence: after applyUpdate, diffLocalToDistant against that distant state has no changes", async () => {
      const { nextState: distantState } = module.diffLocalToDistant(
        fixtures.nonEmptyLocalState,
        null,
      );
      const result = await module.resolveIncrementalUpdate(
        fixtures.emptyLocalState,
        null,
        distantState,
      );
      if (result.hasChanges) {
        const synced = module.applyUpdate(fixtures.emptyLocalState, result.update);
        const { hasChanges } = module.diffLocalToDistant(synced, distantState);
        expect(hasChanges).toBe(false);
      }
    });

    it("nextState is JSON-serializable and fits within 1MB", () => {
      const { nextState } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      let serialized: string;
      expect(() => {
        serialized = JSON.stringify(nextState);
      }).not.toThrow();
      expect(Buffer.byteLength(serialized!, "utf8")).toBeLessThan(1_000_000);
      expect(() => JSON.parse(serialized!)).not.toThrow();
    });

    it("diffLocalToDistant averages under 5ms over 100 calls", () => {
      const t0 = Date.now();
      for (let i = 0; i < 100; i++) {
        module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      }
      expect((Date.now() - t0) / 100).toBeLessThan(5);
    });

    it("applyUpdate averages under 5ms over 100 calls", async () => {
      const { nextState } = module.diffLocalToDistant(fixtures.nonEmptyLocalState, null);
      const result = await module.resolveIncrementalUpdate(
        fixtures.emptyLocalState,
        null,
        nextState,
      );
      if (result.hasChanges) {
        const t0 = Date.now();
        for (let i = 0; i < 100; i++) {
          module.applyUpdate(fixtures.emptyLocalState, result.update);
        }
        expect((Date.now() - t0) / 100).toBeLessThan(5);
      }
    });

    if (fixtures.matchingDistantState !== undefined) {
      const matching = fixtures.matchingDistantState;

      it("diffLocalToDistant has no changes when given matchingDistantState", () => {
        const result = module.diffLocalToDistant(fixtures.nonEmptyLocalState, matching);
        expect(result.hasChanges).toBe(false);
      });

      it("resolveIncrementalUpdate has no changes when incoming matches local", async () => {
        const result = await module.resolveIncrementalUpdate(
          fixtures.nonEmptyLocalState,
          matching,
          matching,
        );
        expect(result.hasChanges).toBe(false);
      });
    }
  });
}
