/**
 * @jest-environment node
 */
import { z } from "zod";
import { makeSaveNewUpdate, makeLocalIncrementalUpdate } from "../walletsync/incrementalUpdates";
import { WalletSyncDataManager } from "@shared/wallet-sync";

type SimpleState = { value: string };
type SimpleUpdate = { newValue: string };
const schema = z.object({ value: z.string() });

function makeMockModule(
  overrides: Partial<WalletSyncDataManager<SimpleState, SimpleUpdate, typeof schema>> = {},
): WalletSyncDataManager<SimpleState, SimpleUpdate, typeof schema> {
  return {
    schema,
    diffLocalToDistant: jest.fn(() => ({ hasChanges: false, nextState: { value: "s" } })),
    resolveIncrementalUpdate: jest.fn(async () => ({ hasChanges: false as const })),
    applyUpdate: jest.fn((local: SimpleState) => local),
    ...overrides,
  };
}

describe("makeSaveNewUpdate", () => {
  const makeSetup = (
    moduleOverrides: Partial<WalletSyncDataManager<SimpleState, SimpleUpdate, typeof schema>> = {},
  ) => {
    const module = makeMockModule(moduleOverrides);
    const saveUpdate = jest.fn(async () => {});
    const localState: SimpleState = { value: "local" };
    const distantState = { value: "distant" };
    const state = { local: localState, distant: distantState, version: 5 };
    const handler = makeSaveNewUpdate({
      walletsync: module,
      getState: () => state,
      latestDistantStateSelector: s => s.distant,
      latestDistantVersionSelector: s => s.version,
      localStateSelector: s => s.local,
      saveUpdate,
    });
    return { module, saveUpdate, state, handler };
  };

  describe("new-data event", () => {
    it("calls resolveIncrementalUpdate with current state", async () => {
      const { module, handler, state } = makeSetup();
      await handler({ type: "new-data", data: { value: "incoming" }, version: 6 });
      expect(module.resolveIncrementalUpdate).toHaveBeenCalledWith(state.local, state.distant, {
        value: "incoming",
      });
    });

    it("calls saveUpdate with new local state when resolveIncrementalUpdate has changes", async () => {
      const newLocal: SimpleState = { value: "updated" };
      const { saveUpdate, handler } = makeSetup({
        resolveIncrementalUpdate: jest.fn(async () => ({
          hasChanges: true,
          update: { newValue: "updated" },
        })),
        applyUpdate: jest.fn(() => newLocal),
      });
      await handler({ type: "new-data", data: { value: "incoming" }, version: 6 });
      expect(saveUpdate).toHaveBeenCalledWith({ value: "incoming" }, 6, newLocal);
    });

    it("does not call saveUpdate with local state when no changes", async () => {
      const { saveUpdate, handler } = makeSetup();
      await handler({ type: "new-data", data: { value: "same" }, version: 5 });
      // version matches latestDistantVersionSelector (5), no changes → saveUpdate NOT called
      expect(saveUpdate).not.toHaveBeenCalled();
    });

    it("calls saveUpdate to bump version when event version differs from latest", async () => {
      const { saveUpdate, handler } = makeSetup();
      // version 7 != state.version 5, no content changes
      await handler({ type: "new-data", data: { value: "same" }, version: 7 });
      expect(saveUpdate).toHaveBeenCalledWith({ value: "same" }, 7, null);
    });
  });

  describe("pushed-data event", () => {
    it("saves pushed data without calling resolveIncrementalUpdate", async () => {
      const { module, saveUpdate, handler } = makeSetup();
      await handler({ type: "pushed-data", data: { value: "pushed" }, version: 3 });
      expect(module.resolveIncrementalUpdate).not.toHaveBeenCalled();
      expect(saveUpdate).toHaveBeenCalledWith({ value: "pushed" }, 3, null);
    });
  });

  describe("deleted-data event", () => {
    it("saves null data with version 0", async () => {
      const { saveUpdate, handler } = makeSetup();
      await handler({ type: "deleted-data" });
      expect(saveUpdate).toHaveBeenCalledWith(null, 0, null);
    });
  });
});

describe("makeLocalIncrementalUpdate", () => {
  const makeSetup = (
    moduleOverrides: Partial<WalletSyncDataManager<SimpleState, SimpleUpdate, typeof schema>> = {},
  ) => {
    const module = makeMockModule(moduleOverrides);
    const saveUpdate = jest.fn(async () => {});
    const localState: SimpleState = { value: "local" };
    const walletState = { data: { value: "distant" }, version: 3 };
    const state = { local: localState, wallet: walletState };
    const update = makeLocalIncrementalUpdate({
      walletsync: module,
      getState: () => state,
      latestWalletStateSelector: s => s.wallet,
      localStateSelector: s => s.local,
      saveUpdate,
    });
    return { module, saveUpdate, state, update };
  };

  it("calls resolveIncrementalUpdate with local and distant (same for both)", async () => {
    const { module, state, update } = makeSetup();
    await update();
    expect(module.resolveIncrementalUpdate).toHaveBeenCalledWith(
      state.local,
      state.wallet.data,
      state.wallet.data,
    );
  });

  it("calls saveUpdate with new local state when changes detected", async () => {
    const newLocal: SimpleState = { value: "applied" };
    const { saveUpdate, state, update } = makeSetup({
      resolveIncrementalUpdate: jest.fn(async () => ({
        hasChanges: true,
        update: { newValue: "applied" },
      })),
      applyUpdate: jest.fn(() => newLocal),
    });
    await update();
    expect(saveUpdate).toHaveBeenCalledWith(state.wallet.data, state.wallet.version, newLocal);
  });

  it("does not call saveUpdate when no changes", async () => {
    const { saveUpdate, update } = makeSetup();
    await update();
    expect(saveUpdate).not.toHaveBeenCalled();
  });
});
