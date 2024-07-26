import timemachine from "timemachine";
import { of, throwError } from "rxjs";
import { Account } from "@ledgerhq/types-live";
import manager from "../../modules/accounts";
import { WalletSyncDataManagerResolutionContext } from "../../types";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { accountDataToAccount } from "../../../liveqr/cross";

timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});

const account1 = genAccount("live-wallet-1");
const account2 = genAccount("live-wallet-2");
const account3 = genAccount("live-wallet-3");
const account4unsupported = genAccount("live-wallet-4");

// we make this type static because the module is not supposed to change it over time!
type AccountDescriptor = {
  id: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

function convertAccountToDescriptor(account: Account): AccountDescriptor {
  return {
    id: account.id,
    currencyId: account.currency.id,
    freshAddress: account.freshAddress,
    seedIdentifier: account.seedIdentifier,
    derivationMode: account.derivationMode,
    index: account.index,
  };
}

function placeholderAccountFromDescriptor(descriptor: AccountDescriptor): Account {
  // NB: this is the current implementation of the module giving the account state before it has opportunity to update, may change over time
  return accountDataToAccount({ ...descriptor, balance: "0", name: "" })[0];
}

const dummyContext: WalletSyncDataManagerResolutionContext = {
  getAccountBridge: () => ({
    sync: (initial: Account) =>
      initial.id === account4unsupported.id
        ? throwError(() => new Error("simulate sync failure"))
        : of(acc => acc),
    receive: () => {
      throw new Error("not implemented");
    },
    createTransaction: () => {
      throw new Error("not implemented");
    },
    updateTransaction: () => {
      throw new Error("not implemented");
    },
    prepareTransaction: () => {
      throw new Error("not implemented");
    },
    getTransactionStatus: () => {
      throw new Error("not implemented");
    },
    estimateMaxSpendable: () => {
      throw new Error("not implemented");
    },
    signOperation: () => {
      throw new Error("not implemented");
    },
    broadcast: () => {
      throw new Error("not implemented");
    },
  }),
  bridgeCache: {
    hydrateCurrency: () => Promise.resolve(null),
    prepareCurrency: () => Promise.resolve(null),
  },
};

describe("accountNames' WalletSyncDataManager", () => {
  it("schema validation", () => {
    expect(manager.schema.parse([])).toEqual([]);
    expect(manager.schema.parse([account1, account2].map(convertAccountToDescriptor))).toEqual(
      [account1, account2].map(convertAccountToDescriptor),
    );
    expect(() => manager.schema.parse([account1])).toThrow();
  });
  it("should find no diff on non initialized state vs empty accounts", () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const latestState = null;
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({ hasChanges: false, nextState: [] });
  });

  it("should find no diff on empty state change", () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const diff = manager.diffLocalToDistant(localData, []);
    expect(diff).toEqual({ hasChanges: false, nextState: [] });
  });

  it("should find no diff on same accounts", () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({ hasChanges: false, nextState: latestState });
  });

  it("should find diff on added account", () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1].map(convertAccountToDescriptor);
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({
      hasChanges: true,
      nextState: [account1, account2].map(convertAccountToDescriptor),
    });
  });

  it("should find diff on removed account", () => {
    const localData = { list: [account1], nonImportedAccountInfos: [] };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const diff = manager.diffLocalToDistant(localData, latestState);
    expect(diff).toEqual({
      hasChanges: true,
      nextState: [account1].map(convertAccountToDescriptor),
    });
  });

  it("should find no diff on non initialized state vs empty accounts", async () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const latestState = null;
    const incomingState: AccountDescriptor[] = [];
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({ hasChanges: false });
  });

  it("should find no diff on empty state change", async () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const incomingState: AccountDescriptor[] = [];
    const diff = await manager.resolveIncrementalUpdate(dummyContext, localData, [], incomingState);
    expect(diff).toEqual({ hasChanges: false });
  });

  it("should find no diff on same accounts", async () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({ hasChanges: false });
  });

  it("should find no diff on added account but the account already is here", async () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({
      hasChanges: false,
    });
  });

  it("should find diff on added account", async () => {
    const localData = { list: [account1], nonImportedAccountInfos: [] };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[1])],
        removed: [],
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should find diff on added account from no existing state", async () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const latestState = null;
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({
      hasChanges: true,
      update: {
        added: [
          placeholderAccountFromDescriptor(incomingState[0]),
          placeholderAccountFromDescriptor(incomingState[1]),
        ],
        removed: [],
        nonImportedAccountInfos: [],
      },
    });
  });

  it("should find diff on removed account", async () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({
      hasChanges: true,
      update: {
        added: [],
        removed: [account2.id],
        nonImportedAccountInfos: [],
      },
    });
  });

  it("should find both a added and removed account", async () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const incomingState = [account2, account3].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[1])],
        removed: [account1.id],
        nonImportedAccountInfos: [],
      },
    });
  });

  it("should find non imported account ids on fail sync", async () => {
    const localData = { list: [account1], nonImportedAccountInfos: [] };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1, account4unsupported].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [],
        removed: [],
        nonImportedAccountInfos: [
          {
            id: account4unsupported.id,
            attempts: 1,
            error: {
              name: "Error",
              message: "simulate sync failure",
            },
          },
        ],
      },
    });
  });

  it("should apply added account", () => {
    const localData = { list: [account1], nonImportedAccountInfos: [] };
    const update = {
      added: [account2],
      removed: [],
      nonImportedAccountInfos: [],
    };
    const result = manager.applyUpdate(localData, update);
    expect(result).toEqual({ list: [account1, account2], nonImportedAccountInfos: [] });
  });

  it("should apply removed account", () => {
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const update = {
      added: [],
      removed: [account2.id],
      nonImportedAccountInfos: [],
    };
    const result = manager.applyUpdate(localData, update);
    expect(result).toEqual({ list: [account1], nonImportedAccountInfos: [] });
  });
});
