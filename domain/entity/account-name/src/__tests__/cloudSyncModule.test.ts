import { accountNamesSyncModule } from "../cloudSyncModule";
import { describeCloudSyncModuleContract } from "@shared/cloud-sync-module/moduleRequirements";

describeCloudSyncModuleContract("accountNamesSyncModule contract", accountNamesSyncModule, {
  emptyLocalState: new Map(),
  nonEmptyLocalState: new Map([
    ["acc1", "My Account"],
    ["acc2", "Savings"],
  ]),
  matchingDistantState: { acc1: "My Account", acc2: "Savings" },
});

const makeMap = (entries: Record<string, string>) => new Map(Object.entries(entries));

describe("accountNamesSyncModule.diffLocalToDistant", () => {
  it("returns hasChanges=false for empty local and null distant", () => {
    const result = accountNamesSyncModule.diffLocalToDistant(new Map(), null);
    expect(result.hasChanges).toBe(false);
    expect(result.nextState).toEqual({});
  });

  it("returns hasChanges=false when local matches distant", () => {
    const local = makeMap({ acc1: "Savings" });
    const distant = { acc1: "Savings" };
    const result = accountNamesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=true when local has new entry", () => {
    const local = makeMap({ acc1: "Savings", acc2: "Trading" });
    const distant = { acc1: "Savings" };
    const result = accountNamesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
    expect(result.nextState).toEqual({ acc1: "Savings", acc2: "Trading" });
  });

  it("returns hasChanges=true when local has renamed entry", () => {
    const local = makeMap({ acc1: "New Name" });
    const distant = { acc1: "Old Name" };
    const result = accountNamesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("returns hasChanges=true when local has removed entry vs distant", () => {
    const local = makeMap({ acc1: "Savings" });
    const distant = { acc1: "Savings", acc2: "Removed" };
    const result = accountNamesSyncModule.diffLocalToDistant(local, distant);
    expect(result.hasChanges).toBe(true);
  });

  it("serializes map to plain object in nextState", () => {
    const local = makeMap({ acc1: "A", acc2: "B" });
    const result = accountNamesSyncModule.diffLocalToDistant(local, null);
    expect(result.nextState).toEqual({ acc1: "A", acc2: "B" });
  });
});

describe("accountNamesSyncModule.resolveIncrementalUpdate", () => {
  it("returns hasChanges=false when incomingState is null", async () => {
    const local = makeMap({ acc1: "Savings" });
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, null, null);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=false when local matches incoming", async () => {
    const local = makeMap({ acc1: "Savings" });
    const incoming = { acc1: "Savings" };
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=false when latestState === incomingState (same reference)", async () => {
    const local = makeMap({});
    const state = { acc1: "Savings" };
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, state, state);
    expect(result.hasChanges).toBe(false);
  });

  it("returns hasChanges=true when incoming has new names", async () => {
    const local = makeMap({ acc1: "Savings" });
    const incoming = { acc1: "Savings", acc2: "Trading" };
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.replaceAllNames).toEqual(incoming);
    }
  });

  it("returns hasChanges=true when incoming renames an account", async () => {
    const local = makeMap({ acc1: "Old Name" });
    const incoming = { acc1: "New Name" };
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, null, incoming);
    expect(result.hasChanges).toBe(true);
    if (result.hasChanges) {
      expect(result.update.replaceAllNames.acc1).toBe("New Name");
    }
  });

  it("returns hasChanges=false when incoming differs from latestState reference but same content as local", async () => {
    const local = makeMap({ acc1: "Savings" });
    const latest = { acc1: "Savings" };
    const incoming = { acc1: "Savings" };
    const result = await accountNamesSyncModule.resolveIncrementalUpdate(local, latest, incoming);
    expect(result.hasChanges).toBe(false);
  });
});

describe("accountNamesSyncModule.applyUpdate", () => {
  it("returns a new Map with replaceAllNames entries", () => {
    const local = makeMap({ acc1: "Old" });
    const update = { replaceAllNames: { acc1: "New", acc2: "Added" } };
    const result = accountNamesSyncModule.applyUpdate(local, update);
    expect(result).toBeInstanceOf(Map);
    expect(result.get("acc1")).toBe("New");
    expect(result.get("acc2")).toBe("Added");
  });

  it("replaces all local names with replaceAllNames", () => {
    const local = makeMap({ acc1: "Keep", acc2: "Remove" });
    const update = { replaceAllNames: { acc1: "Keep" } };
    const result = accountNamesSyncModule.applyUpdate(local, update);
    expect(result.has("acc2")).toBe(false);
  });

  it("handles empty replaceAllNames", () => {
    const local = makeMap({ acc1: "Name" });
    const result = accountNamesSyncModule.applyUpdate(local, { replaceAllNames: {} });
    expect(result.size).toBe(0);
  });
});

describe("accountNamesSyncModule.schema", () => {
  it("parses record of strings", () => {
    const input = { acc1: "Savings", acc2: "Trading" };
    expect(accountNamesSyncModule.schema.parse(input)).toEqual(input);
  });

  it("fails on non-string values", () => {
    expect(() => accountNamesSyncModule.schema.parse({ acc1: 123 })).toThrow();
  });
});
