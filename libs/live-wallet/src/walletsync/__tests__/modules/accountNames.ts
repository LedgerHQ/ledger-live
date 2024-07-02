import manager from "../../modules/accountNames";
import { WalletSyncDataManagerResolutionContext } from "../../types";

const dummyContext: WalletSyncDataManagerResolutionContext = {
  getAccountBridge: () => {
    throw new Error("not required for this test");
  },
  bridgeCache: {
    hydrateCurrency: () => Promise.resolve(null),
    prepareCurrency: () => Promise.resolve(null),
  },
};

describe("accountNames' WalletSyncDataManager", () => {
  it("should find no diff on empty state change", () => {
    const localData = new Map();
    const latestState = null;
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toMatchObject({ hasChanges: false });
  });

  it("should find no diff on same object", () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const latestState = {
      "1": "a",
      "2": "b",
    };
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toMatchObject({ hasChanges: false });
  });

  it("should find diff on added object", () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const latestState = {
      "1": "a",
    };
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toMatchObject({
      hasChanges: true,
      nextState: {
        "1": "a",
        "2": "b",
      },
    });
  });

  it("should find diff on removed object", () => {
    const localData = new Map([["1", "a"]]);
    const latestState = {
      "1": "a",
      "2": "b",
    };
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toMatchObject({
      hasChanges: true,
      nextState: {
        "1": "a",
      },
    });
  });

  it("should find diff on renamed object", () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const latestState = {
      "1": "a",
      "2": "bbbb",
    };
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toMatchObject({
      hasChanges: true,
      nextState: {
        "1": "a",
        "2": "b",
      },
    });
  });

  it("should resolve to no op if no changes", async () => {
    const localData = new Map([["1", "a"]]);
    const latestState = {
      "1": "a",
    };
    const incomingState = {
      "1": "a",
    };
    const diff = await manager.resolveIncomingDistantState(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: false,
    });
  });

  it("should resolve to a new name addition with the full state", async () => {
    const localData = new Map([["1", "a"]]);
    const latestState = {
      "1": "a",
    };
    const incomingState = {
      "1": "a",
      "2": "b",
    };
    const diff = await manager.resolveIncomingDistantState(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        replaceAllNames: {
          "1": "a",
          "2": "b",
        },
      },
    });
  });

  it("should resolve to a rename with the full state", async () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const latestState = {
      "1": "a",
      "2": "b",
    };
    const incomingState = {
      "1": "a",
      "2": "bbbb",
    };
    const diff = await manager.resolveIncomingDistantState(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        replaceAllNames: {
          "1": "a",
          "2": "bbbb",
        },
      },
    });
  });

  it("applies an addition", () => {
    const localData = new Map([["1", "a"]]);
    const update = {
      replaceAllNames: {
        "1": "a",
        "2": "b",
      },
    };
    const next = manager.applyUpdate(localData, update);
    expect(next).toMatchObject(
      new Map([
        ["1", "a"],
        ["2", "b"],
      ]),
    );
  });

  it("applies a removal", () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const update = {
      replaceAllNames: {
        "1": "a",
      },
    };
    const next = manager.applyUpdate(localData, update);
    expect(next).toMatchObject(new Map([["1", "a"]]));
  });

  it("applies a rename", () => {
    const localData = new Map([
      ["1", "a"],
      ["2", "b"],
    ]);
    const update = {
      replaceAllNames: {
        "1": "a",
        "2": "bbbb",
      },
    };
    const next = manager.applyUpdate(localData, update);
    expect(next).toMatchObject(
      new Map([
        ["1", "a"],
        ["2", "bbbb"],
      ]),
    );
  });
});
