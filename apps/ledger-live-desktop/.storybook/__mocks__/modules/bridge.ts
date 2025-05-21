import merge from "lodash/merge";
import * as mockedBridge from "@ledgerhq/live-common/bridge/mockHelpers";
export { getCurrencyBridge } from "@ledgerhq/live-common/bridge/impl";
import { apiProxy } from "../_utils";

export const getAccountBridge = () =>
  apiProxy("Bridge", {
    ...mockedBridge,
    estimateMaxSpendable: () => Promise.resolve({}),
    updateTransaction: (transaction: Record<string, any>, newTransaction: object) =>
      transaction.__extends?.(newTransaction) ?? merge(transaction, newTransaction),
  });
