import type { Account } from "@ledgerhq/types-live";
import { useRoute } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

export function useFieldByFamily(field: string): BigNumber | null | undefined {
  return useRoute().params?.transaction[field];
}
export function useEditTxFeeByFamily() {
  const transaction = useRoute().params?.transaction;
  return ({
    account,
    field,
    fee,
  }: {
    account: Account;
    field: string;
    fee: BigNumber | null | undefined;
  }) => {
    const bridge = getAccountBridge(account);
    return bridge.updateTransaction(transaction, {
      [field]: fee,
    });
  };
}

/**
 * Returns the first error (no matter which field) from transaction status
 *
 * @param {Object} status - The transaction status
 * @param {*} type - the key to fetch first error from (errors or warnings)
 */
export function getFirstStatusError(
  status:
    | {
        errors: any;
        warnings: any;
      }
    | null
    | undefined,
  type: "errors" | "warnings" = "errors",
): Error | null | undefined {
  if (!status || !status[type]) return null;
  const firstKey = Object.keys(status[type])[0];
  return firstKey ? status[type][firstKey] : null;
}

/**
 *  Returns true if transaction status contains errors
 *
 * @param {Object} status - The transaction status
 */
export function hasStatusError(status: any): boolean | null | undefined {
  if (!status || !status.errors) return false;
  return !!Object.keys(status.errors).length;
}
