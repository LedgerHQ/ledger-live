import { z, type ZodType } from "zod";
import { createAggregator, type CloudSyncDataManager } from "./cloudSyncModule";

type Fixtures<LocalState, DistantState> = {
  /** A local state with no meaningful data (e.g. empty map/array/object) */
  emptyLocalState: LocalState;
  /** A local state with some meaningful data to exercise diff and convergence */
  nonEmptyLocalState: LocalState;
  /** Optional: a distant state known to match nonEmptyLocalState exactly */
  matchingDistantState?: DistantState;
};

/** UTF-8 byte length, without Buffer or TextEncoder so consumers need no node/dom types */
function utf8ByteLength(value: string): number {
  let bytes = 0;
  // iterating the string yields whole code points, so a surrogate pair counts once
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code < 0x10000) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }
  return bytes;
}

/** the module under test plus a healthy neighbour, to prove failures do not cascade */
function composeWithNeighbour<
  LocalState,
  Update,
  DistantState,
  Schema extends ZodType<DistantState>,
>(module: CloudSyncDataManager<LocalState, Update, Schema, DistantState>) {
  const quarantined: string[] = [];
  const neighbour: CloudSyncDataManager<string[], string[], ZodType<string[]>, string[]> = {
    schema: z.array(z.string()),
    diffLocalToDistant: local => ({ hasChanges: local.length > 0, nextState: local }),
    resolveIncrementalUpdate: async () => ({ hasChanges: false }),
    applyUpdate: (_local, update) => update,
  };
  const aggregator = createAggregator(
    { subject: module, neighbour },
    { onModuleError: key => quarantined.push(key) },
  );
  return { aggregator, quarantined };
}

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
 * - composed in an aggregator, arbitrary garbage as incomingState never breaks the sync
 */
export function describeCloudSyncModuleContract<
  LocalState,
  Update,
  DistantState,
  Schema extends ZodType<DistantState>,
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
      expect(utf8ByteLength(serialized!)).toBeLessThan(1_000_000);
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

    describe("composed in an aggregator, tolerates arbitrary garbage as incomingState", () => {
      // isolation is the aggregator's job, so this checks the module composes safely in one
      const garbageValues: [label: string, value: unknown][] = [
        ["null", null],
        ["undefined", undefined],
        ["0", 0],
        ["-1", -1],
        ["NaN", Number.NaN],
        ["Infinity", Number.POSITIVE_INFINITY],
        ["empty string", ""],
        ["string", "garbage"],
        ["true", true],
        ["false", false],
        ["empty array", []],
        ["empty object", {}],
        ["array of null", [null]],
        ["array of foreign objects", [{ nope: true }]],
        ["object with unexpected key", { unexpected: "key" }],
        ["deeply nested object", { nested: { deep: [1, "2", null, { deeper: true }] } }],
        ["__proto__ payload", JSON.parse('{"__proto__": {"polluted": true}}')],
      ];

      it.each(garbageValues)(
        "resolveIncrementalUpdate(%s) resolves without breaking the sync",
        async (_label, garbage) => {
          for (const localState of [fixtures.emptyLocalState, fixtures.nonEmptyLocalState]) {
            const { aggregator } = composeWithNeighbour(module);
            const local = { subject: localState, neighbour: ["n"] };
            const result = await aggregator.resolveIncrementalUpdate(local, null, {
              subject: garbage,
              neighbour: ["n"],
            });
            expect(typeof result.hasChanges).toBe("boolean");
            if (result.hasChanges) {
              expect(() => aggregator.applyUpdate(local, result.update)).not.toThrow();
            }
          }
        },
      );

      it.each(garbageValues)(
        "diffLocalToDistant(%s) keeps a serializable nextState and never deletes the slice",
        (_label, garbage) => {
          for (const localState of [fixtures.emptyLocalState, fixtures.nonEmptyLocalState]) {
            const { aggregator, quarantined } = composeWithNeighbour(module);
            const distant = { subject: garbage, neighbour: ["n"] };
            const result = aggregator.diffLocalToDistant(
              { subject: localState, neighbour: ["n"] },
              distant,
            );
            expect(typeof result.hasChanges).toBe("boolean");
            expect(() => JSON.stringify(result.nextState)).not.toThrow();
            // a healthy neighbour must keep syncing whatever the subject did
            expect(result.nextState.neighbour).toEqual(["n"]);
            // quarantine must never become deletion
            if (quarantined.includes("subject")) {
              expect((result.nextState as Record<string, unknown>).subject).toEqual(garbage);
            }
          }
        },
      );
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
