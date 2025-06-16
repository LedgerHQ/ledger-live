import timemachine from "timemachine";
import { WalletSyncDataManagerResolutionContext } from "../types";
import { Account } from "@ledgerhq/types-live";
import { of, throwError } from "rxjs";

timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});

export const contextWithSyncFailures = (shouldFailOnAccount: (_: Account) => boolean) => ({
  getAccountBridge: () => ({
    sync: (initial: Account) =>
      shouldFailOnAccount(initial)
        ? throwError(() => new Error("simulate sync failure"))
        : of((acc: Account) => acc),
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
});

export const dummyContext: WalletSyncDataManagerResolutionContext = contextWithSyncFailures(
  () => false,
);
