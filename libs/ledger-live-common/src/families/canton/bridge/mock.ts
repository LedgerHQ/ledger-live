import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { createApi } from "@ledgerhq/coin-canton/api/index";
import { Transaction as CantonTransaction, CantonAccount } from "@ledgerhq/coin-canton/types";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

// The calls data can be copied to mock-data.ts from the file.
// This function creates a live API with logging for generating mock data
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const signerContext = {};

  const apiGetter = makeLRUCache(
    config => Promise.resolve(createApi(config)),
    config => config.nodeUrl || "",
    minutes(1000),
  );

  return {
    getAPI: apiGetter,
    getQueuedAPI: apiGetter,
    getQueuedAndCachedAPI: apiGetter,
    signerContext,
  };
}

const createTransaction = (): CantonTransaction => {
  return {
    family: "canton",
    amount: new BigNumber(0),
    recipient: "",
    tokenId: "Amulet",
    fee: null,
  };
};

const updateTransaction = (
  t: CantonTransaction,
  patch: Partial<CantonTransaction>,
): CantonTransaction => {
  return { ...t, ...patch };
};

const getTransactionStatus = async (): Promise<any> => {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };
};

const estimateMaxSpendable = ({ account }: { account: CantonAccount }): Promise<BigNumber> => {
  return Promise.resolve(account.balance || new BigNumber(0));
};

const prepareTransaction = async (
  _account: CantonAccount,
  transaction: CantonTransaction,
): Promise<CantonTransaction> => {
  return {
    ...transaction,
    fee: transaction.fee || new BigNumber(100),
  };
};

const sync = (_initialAccount: CantonAccount): any => {
  return {
    subscribe: (observer: any) => {
      observer.next((acc: CantonAccount) => acc);
      observer.complete();
      return { unsubscribe: () => {} };
    },
  };
};

const receive = (_account: CantonAccount, _opts: { deviceId: string }): any => {
  return {
    subscribe: (observer: any) => {
      observer.next({
        address: "mock-address",
        path: "44'/60'/0'/0/0",
        publicKey: "mock-public-key",
      });
      observer.complete();
      return { unsubscribe: () => {} };
    },
  };
};

const signOperation = (): any => {
  return {
    subscribe: (observer: any) => {
      observer.next({
        operation: {
          id: "mock-operation-id",
          hash: "mock-hash",
          type: "OUT",
          value: new BigNumber(0),
          fee: new BigNumber(100),
          blockHash: "mock-block-hash",
          blockHeight: 12345,
          accountId: "mock-account-id",
          date: new Date(),
          extra: {},
        },
        signature: "mock-signature",
      });
      observer.complete();
      return { unsubscribe: () => {} };
    },
  };
};

const broadcast = async (): Promise<any> => {
  return {
    id: "mock-operation-id",
    hash: "mock-hash",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(100),
    blockHash: "mock-block-hash",
    blockHeight: 12345,
    accountId: "mock-account-id",
    date: new Date(),
    extra: {},
  };
};

const scanAccounts = (): any => {
  return {
    subscribe: (observer: any) => {
      observer.next({
        type: "discovered",
        account: {
          id: "mock-account-id",
          name: "Mock Canton Account",
          address: "mock-address",
          currency: { id: "canton_network_devnet" },
          balance: new BigNumber(0),
          spendableBalance: new BigNumber(0),
          blockHeight: 0,
          lastSyncDate: new Date(),
          operations: [],
          pendingOperations: [],
          cantonResources: {
            instrumentUtxoCounts: {},
          },
        },
      });
      observer.complete();
      return { unsubscribe: () => {} };
    },
  };
};

const getSerializedAddressParameters = (): Buffer => {
  return Buffer.from("mock-address-params");
};

const accountBridge: AccountBridge<CantonTransaction, CantonAccount> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  signRawOperation: () => {
    throw new Error("signRawOperation is not supported");
  },
  broadcast,
  getSerializedAddressParameters,
};

const currencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

export default {
  accountBridge,
  currencyBridge,
};
