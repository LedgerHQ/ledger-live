import { z } from "zod";
import { createAggregator, mapValues } from "../index";

describe(mapValues.name, () => {
  it("maps object values while preserving keys", () => {
    expect(mapValues({ a: 1, b: 2 }, value => value * 2)).toEqual({ a: 2, b: 4 });
  });
});

describe(createAggregator.name, () => {
  const alphaModule = {
    schema: z.array(z.string()),
    diffLocalToDistant: (local: string[], latest: string[] | null) => ({
      hasChanges: local.join() !== (latest ?? []).join(),
      nextState: local,
    }),
    resolveIncrementalUpdate: async (
      local: string[],
      latest: string[] | null,
      incoming: string[] | null,
    ) => {
      if (!incoming || incoming.join() === (latest ?? []).join()) {
        return { hasChanges: false as const };
      }
      if (incoming.join() === local.join()) {
        return { hasChanges: false as const };
      }
      return { hasChanges: true as const, update: incoming };
    },
    applyUpdate: (_local: string[], update: string[]) => update,
  };

  const betaModule = {
    schema: z.number(),
    diffLocalToDistant: (local: number, latest: number | null) => ({
      hasChanges: local !== (latest ?? 0),
      nextState: local,
    }),
    resolveIncrementalUpdate: async (
      local: number,
      latest: number | null,
      incoming: number | null,
    ) => {
      if (incoming == null || incoming === latest || incoming === local) {
        return { hasChanges: false as const };
      }
      return { hasChanges: true as const, update: incoming };
    },
    applyUpdate: (_local: number, update: number) => update,
  };

  const aggregator = createAggregator({ alpha: alphaModule, beta: betaModule });

  it("aggregates diffLocalToDistant across modules and preserves unknown distant keys", () => {
    const result = aggregator.diffLocalToDistant({ alpha: ["a"], beta: 2 }, {
      alpha: ["a"],
      beta: 1,
      legacy: true,
    } as never);
    expect(result.hasChanges).toBe(true);
    expect(result.nextState).toEqual({ alpha: ["a"], beta: 2, legacy: true });
  });

  it("returns hasChanges=false when all modules are unchanged", () => {
    const distant = { alpha: ["a"], beta: 1 };
    const result = aggregator.diffLocalToDistant({ alpha: ["a"], beta: 1 }, distant);
    expect(result.hasChanges).toBe(false);
    expect(result.nextState.alpha).toEqual(["a"]);
    expect(result.nextState.beta).toBe(1);
  });

  it("returns hasChanges=false when resolveIncrementalUpdate finds no changes", async () => {
    const distant = { alpha: ["a"], beta: 1 };
    const result = await aggregator.resolveIncrementalUpdate(
      { alpha: ["a"], beta: 1 },
      distant,
      distant,
    );
    expect(result.hasChanges).toBe(false);
  });

  it("returns combined update when at least one module changes", async () => {
    const result = await aggregator.resolveIncrementalUpdate(
      { alpha: ["a"], beta: 1 },
      { alpha: ["a"], beta: 1 },
      { alpha: ["b"], beta: 1 },
    );
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.alpha).toEqual({ hasChanges: true, update: ["b"] });
      expect(result.update.beta).toEqual({ hasChanges: false });
    }
  });

  it("applyUpdate only applies modules that reported changes", () => {
    const local = { alpha: ["a"], beta: 1 };
    const result = aggregator.applyUpdate(local, {
      alpha: { hasChanges: true, update: ["z"] },
      beta: { hasChanges: false },
    } as Parameters<typeof aggregator.applyUpdate>[1]);
    expect(result).toEqual({ alpha: ["z"], beta: 1 });
  });

  it("handles null distant states during diff and resolve", async () => {
    const result = aggregator.diffLocalToDistant({ alpha: ["a"], beta: 1 }, null);
    expect(result.hasChanges).toBe(true);

    const resolved = await aggregator.resolveIncrementalUpdate({ alpha: [], beta: 0 }, null, {
      alpha: ["a"],
      beta: 1,
    });
    expect(resolved.hasChanges).toBe(true);
  });
});
