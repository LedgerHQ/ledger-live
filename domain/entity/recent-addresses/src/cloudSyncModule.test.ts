import { z } from "zod";
import { createAggregator, type CloudSyncDataManager } from "@shared/cloud-sync-module";
import { recentAddressesSyncModule, RecentAddressesDistantSchema } from "./cloudSyncModule";
import type { RecentAddressesState } from "./schema";
import { describeCloudSyncModuleContract } from "@shared/cloud-sync-module/moduleRequirements";

type Names = Record<string, string>;
/** a healthy neighbour, to prove a quarantine stays confined to its own module */
const namesModule: CloudSyncDataManager<Names, Names, z.ZodType<Names>, Names> = {
  schema: z.record(z.string(), z.string()),
  diffLocalToDistant: local => ({ hasChanges: false, nextState: local }),
  resolveIncrementalUpdate: async () => ({ hasChanges: false }),
  applyUpdate: local => local,
};

describeCloudSyncModuleContract("recentAddressesSyncModule contract", recentAddressesSyncModule, {
  emptyLocalState: {},
  nonEmptyLocalState: { bitcoin: [{ address: "bc1q", lastUsed: 1000 }] },
  matchingDistantState: { bitcoin: [{ address: "bc1q", index: 0, lastUsed: 1000 }] },
});

const addr = (address: string, lastUsed = 1000) => ({ address, lastUsed });

describe("RecentAddressesDistantSchema", () => {
  it("parses valid distant state", () => {
    const input = { bitcoin: [{ address: "bc1q", index: 0, lastUsed: 1000 }] };
    expect(RecentAddressesDistantSchema.parse(input)).toEqual(input);
  });

  it("rejects a slice holding an invalid entry rather than dropping it", () => {
    const input = {
      bitcoin: [{ address: "bc1q", index: 0 }, "invalid", null, { address: "bc1b", index: 1 }],
    };
    expect(RecentAddressesDistantSchema.safeParse(input).success).toBe(false);
  });

  it("rejects the corrupted nested address format instead of repairing it", () => {
    const input = {
      bitcoin: [{ address: { address: "bc1q", lastUsed: 500 }, index: 0, lastUsed: 600 }],
    };
    expect(RecentAddressesDistantSchema.safeParse(input).success).toBe(false);
  });
});

describe("a corrupted distant slice quarantines the module", () => {
  it("preserves the slice verbatim and reports it, leaving healthy modules alone", () => {
    const onModuleError = jest.fn();
    const aggregator = createAggregator(
      { recentAddresses: recentAddressesSyncModule, names: namesModule },
      { onModuleError },
    );
    const corrupted = {
      recentAddresses: { bitcoin: [{ address: { address: "bc1q" }, index: 0 }] },
      names: { "account-1": "from another instance" },
    };

    const { nextState } = aggregator.diffLocalToDistant(
      { recentAddresses: { bitcoin: [addr("bc1local")] }, names: {} },
      corrupted,
    );

    expect(nextState.recentAddresses).toEqual(corrupted.recentAddresses);
    expect(onModuleError).toHaveBeenCalledTimes(1);
    expect(onModuleError.mock.calls[0][0]).toBe("recentAddresses");
    expect(nextState.names).toEqual({});
  });
});

describe("recentAddressesSyncModule.diffLocalToDistant", () => {
  it("returns hasChanges=false for empty local and null distant", () => {
    const result = recentAddressesSyncModule.diffLocalToDistant({}, null);
    expect(result.hasChanges).toBe(false);
    expect(result.nextState).toEqual({});
  });

  it("returns hasChanges=false when local matches distant exactly", () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1q")] };
    const distant = { bitcoin: [{ address: "bc1q", index: 0, lastUsed: 1000 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(false);
    expect(result.nextState).toBe(distant);
  });

  it("returns hasChanges=true when local has extra address", () => {
    const local: RecentAddressesState = {
      bitcoin: [addr("bc1q"), addr("bc1b")],
    };
    const distant = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
    expect(result.nextState.bitcoin).toHaveLength(2);
  });

  it("returns hasChanges=true when local has different address", () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1DIFFERENT")] };
    const distant = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("returns hasChanges=true when local has new currency", () => {
    const local: RecentAddressesState = {
      bitcoin: [addr("bc1q")],
      ethereum: [addr("0x1")],
    };
    const distant = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("returns hasChanges=true when local removed a currency", () => {
    const local: RecentAddressesState = {};
    const distant = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("returns hasChanges=true when distant index is out of bounds", () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1q")] };
    const distant = { bitcoin: [{ address: "bc1q", index: 5 }] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("serializes lastUsed in nextState", () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1q", 9999)] };
    const result = recentAddressesSyncModule.diffLocalToDistant(local, null);
    expect(result.hasChanges).toBe(true);
    expect(result.nextState.bitcoin[0].lastUsed).toBe(9999);
  });
});

describe("recentAddressesSyncModule.resolveIncrementalUpdate", () => {
  it("returns hasChanges=false when incomingState is null", async () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1q")] };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(local, null, null);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=false when incoming matches local", async () => {
    const local: RecentAddressesState = { bitcoin: [addr("bc1q")] };
    const distant = { bitcoin: [{ address: "bc1q", index: 0, lastUsed: 1000 }] };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(
      local,
      distant,
      distant,
    );
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=false for identical latestState and incomingState references", async () => {
    const local: RecentAddressesState = {};
    const state = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(local, state, state);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=true when incoming has new addresses", async () => {
    const local: RecentAddressesState = {};
    const incoming = { bitcoin: [{ address: "bc1q", index: 0, lastUsed: 1000 }] };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.bitcoin).toHaveLength(1);
      expect(result.update.bitcoin[0].address).toBe("bc1q");
    }
  });

  it("sorts addresses by index in update", async () => {
    const local: RecentAddressesState = {};
    const incoming = {
      bitcoin: [
        { address: "bc1b", index: 1, lastUsed: 2000 },
        { address: "bc1a", index: 0, lastUsed: 1000 },
      ],
    };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.bitcoin[0].address).toBe("bc1a");
      expect(result.update.bitcoin[1].address).toBe("bc1b");
    }
  });

  it("falls back to Date.now() when lastUsed is undefined", async () => {
    const before = Date.now();
    const local: RecentAddressesState = {};
    const incoming = { bitcoin: [{ address: "bc1q", index: 0 }] };
    const result = await recentAddressesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    const after = Date.now();
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.bitcoin[0].lastUsed).toBeGreaterThanOrEqual(before);
      expect(result.update.bitcoin[0].lastUsed).toBeLessThanOrEqual(after);
    }
  });
});

describe("recentAddressesSyncModule.applyUpdate", () => {
  it("replaces local data with update entirely", () => {
    const local: RecentAddressesState = { bitcoin: [addr("old")] };
    const update: RecentAddressesState = { ethereum: [addr("0x1")] };
    const result = recentAddressesSyncModule.applyUpdate(local, update);
    expect(result).toBe(update);
  });

  it("ignores local data", () => {
    const local: RecentAddressesState = { bitcoin: [addr("should-be-ignored")] };
    const update: RecentAddressesState = {};
    expect(recentAddressesSyncModule.applyUpdate(local, update)).toEqual({});
  });
});
