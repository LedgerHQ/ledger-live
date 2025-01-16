import timemachine from "timemachine";
import { of, throwError } from "rxjs";
import { Account } from "@ledgerhq/types-live";
import manager, { NonImportedAccountInfo } from "../../modules/accounts";
import { WalletSyncDataManagerResolutionContext } from "../../types";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { accountDataToAccount } from "../../../liveqr/cross";

timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});

const account1 = genAccount("live-wallet-1");
const account1NonImported: NonImportedAccountInfo = {
  id: account1.id,
  attempts: 1,
  attemptsLastTimestamp: new Date().getTime() - 1000,
};
const account2 = genAccount("live-wallet-2");
const account2NonImported: NonImportedAccountInfo = {
  id: account2.id,
  attempts: 1,
  attemptsLastTimestamp: new Date().getTime() - 1000,
};
const account3 = genAccount("live-wallet-3");
const account4unsupported = genAccount("live-wallet-4");
const account4unsupportedNonImported: NonImportedAccountInfo = {
  id: account4unsupported.id,
  attempts: 1,
  attemptsLastTimestamp: new Date().getTime() - 1000,
};

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

function unmigrate(account: Account): Account {
  return {
    ...account,
    id: account.id.replace("mock:1", "mock:0"),
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
        : // this mock bridge will migrate 0->1 on versions
          initial.id.startsWith("mock:0")
          ? of(acc => ({ ...acc, id: acc.id.replace("mock:0", "mock:1") }))
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
    getSerializedAddressParameters: () => {
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

  it("dedup account that could be implicitely migrated by coin implementations", async () => {
    const account2unmigrated = unmigrate(account2);
    const account3unmigrated = unmigrate(account3);
    const localData = { list: [account1, account2], nonImportedAccountInfos: [] };
    const latestState = localData.list.map(convertAccountToDescriptor);
    const incomingState = [account1, account2unmigrated, account3unmigrated].map(
      convertAccountToDescriptor,
    );
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    if (!diff.hasChanges) throw new Error("unexpected");
    const result = manager.applyUpdate(localData, diff.update);
    expect(result.list.map(l => l.id)).toEqual([account1, account2, account3].map(l => l.id));
  });

  it("should not have changes when there is no incoming state", async () => {
    const localData = { list: [], nonImportedAccountInfos: [] };
    const latestState = null;
    const incomingState = null;
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toEqual({ hasChanges: false });
  });

  it("should ignore a non imported account that is now present in the localData", async () => {
    const localData = {
      list: [account1],
      nonImportedAccountInfos: [account1NonImported],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
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
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should ignore a non imported account that is not present in the incomingState anymore", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [account1NonImported],
    };
    const latestState = [].map(convertAccountToDescriptor);
    const incomingState = [].map(convertAccountToDescriptor);
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
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should retry importation of a non imported account if it has been long enough", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        { ...account1NonImported, attemptsLastTimestamp: new Date().getTime() - 60000 },
      ],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[0])],
        removed: [],
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should avoid importing duplicate of a non imported account if it has been removed from the latest state", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        { ...account1NonImported, attemptsLastTimestamp: new Date().getTime() - 60000 },
      ],
    };
    const latestState = [].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[0])],
        removed: [],
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should not retry importation of a non imported account if it has not been long enough", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [account1NonImported],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: false,
    });
  });
  it("should not retry importation of a non imported account if it has not been long enough even if there is a new account", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [account1NonImported],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[1])],
        removed: [],
        nonImportedAccountInfos: [account1NonImported],
      },
    });
  });
  it("should retry importation of a non imported account if it has been long enough even if there is a new account", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        { ...account1NonImported, attemptsLastTimestamp: new Date().getTime() - 60000 },
      ],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [
          placeholderAccountFromDescriptor(incomingState[1]),
          placeholderAccountFromDescriptor(incomingState[0]),
        ],
        removed: [],
        nonImportedAccountInfos: [],
      },
    });
  });
  it("should retry importation of a non imported account if it has been long enough and not retry importation of another if it has not been long enough", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        { ...account1NonImported, attemptsLastTimestamp: new Date().getTime() - 60000 },
        account2NonImported,
      ],
    };
    const latestState = [account1, account2].map(convertAccountToDescriptor);
    const incomingState = [account1, account2].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: true,
      update: {
        added: [placeholderAccountFromDescriptor(incomingState[0])],
        removed: [],
        nonImportedAccountInfos: [account2NonImported],
      },
    });
  });
  it("should have a longer delay when we tried importing an account multiple times", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        {
          ...account1NonImported,
          attempts: 10,
          attemptsLastTimestamp: new Date().getTime() - 60000,
        },
      ],
    };
    const latestState = [account1].map(convertAccountToDescriptor);
    const incomingState = [account1].map(convertAccountToDescriptor);
    const diff = await manager.resolveIncrementalUpdate(
      dummyContext,
      localData,
      latestState,
      incomingState,
    );
    expect(diff).toMatchObject({
      hasChanges: false,
    });
  });
  it("should increment progressively the delay between importation retries when it keeps failing", async () => {
    const localData = {
      list: [],
      nonImportedAccountInfos: [
        {
          ...account4unsupportedNonImported,
          attempts: 10,
          attemptsLastTimestamp: new Date().getTime() - 60000 * 10,
        },
      ],
    };
    const latestState = [account4unsupported].map(convertAccountToDescriptor);
    const incomingState = [account4unsupported].map(convertAccountToDescriptor);
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
            ...account4unsupportedNonImported,
            attempts: 11,
            attemptsLastTimestamp: new Date().getTime(),
          },
        ],
      },
    });
  });
});
