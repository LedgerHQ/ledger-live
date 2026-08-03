/**
 * @jest-environment node
 */
import { z } from "zod";
import { createAggregator, WalletSyncDataManager } from "@shared/wallet-sync";

function makeMockModule<L, U>(
  overrides: Partial<WalletSyncDataManager<L, U, z.ZodString>> = {},
): WalletSyncDataManager<L, U, z.ZodString> {
  return {
    schema: z.string(),
    diffLocalToDistant: jest.fn(() => ({ hasChanges: false, nextState: "state" as any })),
    resolveIncrementalUpdate: jest.fn(async () => ({ hasChanges: false as const })),
    applyUpdate: jest.fn((local: L) => local),
    ...overrides,
  };
}

describe("createAggregator", () => {
  describe("schema", () => {
    it("creates an object schema from modules", () => {
      const mod = makeMockModule<string, string>();
      const agg = createAggregator({ accounts: mod });
      const result = agg.schema.parse({ accounts: "val" });
      expect(result).toEqual({ accounts: "val" });
    });

    it("makes all keys optional in aggregated schema", () => {
      const mod = makeMockModule<string, string>();
      const agg = createAggregator({ accounts: mod });
      const result = agg.schema.parse({});
      expect(result).toEqual({});
    });
  });

  describe("diffLocalToDistant", () => {
    it("returns hasChanges=false when no module has changes", () => {
      const mod = makeMockModule();
      const agg = createAggregator({ accounts: mod });
      const result = agg.diffLocalToDistant({ accounts: "local" }, { accounts: "state" });
      expect(result.hasChanges).toBe(false);
    });

    it("returns hasChanges=true when any module has changes", () => {
      const mod = makeMockModule({
        diffLocalToDistant: jest.fn(() => ({ hasChanges: true, nextState: "new" })),
      });
      const agg = createAggregator({ accounts: mod });
      const result = agg.diffLocalToDistant({ accounts: "local" }, null);
      expect(result.hasChanges).toBe(true);
    });

    it("passes null to module when latestState is null", () => {
      const mod = makeMockModule();
      const agg = createAggregator({ accounts: mod });
      agg.diffLocalToDistant({ accounts: "local" }, null);
      expect(mod.diffLocalToDistant).toHaveBeenCalledWith("local", null);
    });

    it("passes correct slice of latestState to each module", () => {
      const mod = makeMockModule();
      const agg = createAggregator({ accounts: mod });
      agg.diffLocalToDistant({ accounts: "local" }, { accounts: "distant" });
      expect(mod.diffLocalToDistant).toHaveBeenCalledWith("local", "distant");
    });

    it("preserves unknown keys in nextState", () => {
      const mod = makeMockModule({
        diffLocalToDistant: jest.fn(() => ({ hasChanges: false, nextState: "kept" })),
      });
      const agg = createAggregator({ accounts: mod });
      const result = agg.diffLocalToDistant({ accounts: "local" }, {
        accounts: "distant",
        unknownKey: "preserved",
      } as any);
      expect((result.nextState as any).unknownKey).toBe("preserved");
    });

    it("handles multiple modules — aggregates hasChanges", () => {
      const stable = makeMockModule();
      const changed = makeMockModule({
        diffLocalToDistant: jest.fn(() => ({ hasChanges: true, nextState: "new" })),
      });
      const agg = createAggregator({ stable, changed });
      const result = agg.diffLocalToDistant({ stable: "s", changed: "c" }, null);
      expect(result.hasChanges).toBe(true);
    });
  });

  describe("resolveIncrementalUpdate", () => {
    it("returns hasChanges=false when all modules return no changes", async () => {
      const mod = makeMockModule();
      const agg = createAggregator({ accounts: mod });
      const result = await agg.resolveIncrementalUpdate({ accounts: "l" }, null, null);
      expect(result.hasChanges).toBe(false);
    });

    it("returns hasChanges=true when any module has changes", async () => {
      const mod = makeMockModule({
        resolveIncrementalUpdate: jest.fn(async () => ({
          hasChanges: true,
          update: "update",
        })),
      });
      const agg = createAggregator({ accounts: mod });
      const result = await agg.resolveIncrementalUpdate({ accounts: "l" }, null, { accounts: "d" });
      expect(result.hasChanges).toBe(true);
    });

    it("passes null to modules when incomingState is null", async () => {
      const mod = makeMockModule();
      const agg = createAggregator({ accounts: mod });
      await agg.resolveIncrementalUpdate({ accounts: "l" }, null, null);
      expect(mod.resolveIncrementalUpdate).toHaveBeenCalledWith("l", null, null);
    });

    it("resolves all modules in parallel", async () => {
      const order: string[] = [];
      const slow = makeMockModule({
        resolveIncrementalUpdate: jest.fn(async () => {
          order.push("slow");
          return { hasChanges: false as const };
        }),
      });
      const fast = makeMockModule({
        resolveIncrementalUpdate: jest.fn(async () => {
          order.push("fast");
          return { hasChanges: false as const };
        }),
      });
      const agg = createAggregator({ slow, fast });
      await agg.resolveIncrementalUpdate({ slow: "s", fast: "f" }, null, null);
      expect(order).toContain("slow");
      expect(order).toContain("fast");
    });
  });

  describe("applyUpdate", () => {
    it("applies each module's update", () => {
      const mod = makeMockModule<string, string>({
        applyUpdate: jest.fn(() => "updated"),
      });
      const agg = createAggregator({ accounts: mod });
      const result = agg.applyUpdate(
        { accounts: "old" },
        { accounts: { hasChanges: true, update: "upd" } },
      );
      expect(result.accounts).toBe("updated");
    });

    it("keeps local value when module update has no changes", () => {
      const mod = makeMockModule<string, string>();
      const agg = createAggregator({ accounts: mod });
      const result = agg.applyUpdate(
        { accounts: "unchanged" },
        { accounts: { hasChanges: false } },
      );
      expect(result.accounts).toBe("unchanged");
    });
  });
});
