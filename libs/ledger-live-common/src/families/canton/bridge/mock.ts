import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { createApi } from "@ledgerhq/coin-canton/api/index";
import { Transaction as CantonTransaction, CantonAccount } from "@ledgerhq/coin-canton/types";
import type { AccountBridge } from "@ledgerhq/types-live";
import { CANTON_UNSET_RECIPIENT } from "@ledgerhq/coin-canton/constants";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { validateAddress } from "../../../bridge/validateAddress";
import { scanAccounts } from "../../../bridge/mockHelpers";

type CantonAccountBridge = AccountBridge<CantonTransaction, CantonAccount>;

// The calls data can be copied to mock-data.ts from the file.
// This function creates a live API with logging for generating mock data
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function createMockDataForAPI() {
  const signerContext = {};

  const apiGetter = makeLRUCache(
    (): Promise<ReturnType<typeof createApi>> => Promise.resolve(createApi()),
    () => "",
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

const getTransactionStatus: CantonAccountBridge["getTransactionStatus"] = async () => {
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

const sync: CantonAccountBridge["sync"] = _initialAccount =>
  new Observable(observer => {
    observer.next((acc: CantonAccount) => acc);
    observer.complete();
  });

const receive: CantonAccountBridge["receive"] = (_account, _opts) =>
  new Observable(observer => {
    observer.next({
      address: "mock-address",
      path: "44'/60'/0'/0/0",
      publicKey: "mock-public-key",
    });
    observer.complete();
  });

const signOperation: CantonAccountBridge["signOperation"] = () =>
  new Observable(observer => {
    observer.next({
      type: "signed",
      signedOperation: {
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
          senders: [],
          recipients: [],
          extra: {},
        },
        signature: "mock-signature",
      },
    });
    observer.complete();
  });

const broadcast: CantonAccountBridge["broadcast"] = async () => {
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
    senders: [],
    recipients: [],
    extra: {},
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
  validateAddress,
  getEstimationRecipient: () => CANTON_UNSET_RECIPIENT,
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
