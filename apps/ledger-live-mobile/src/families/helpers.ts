import { useRoute } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, DomainServiceResolution } from "@ledgerhq/types-live";
import type {
  BaseComposite,
  StackNavigatorProps,
} from "../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../const";

type Navigation = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
>;

export function useFieldByFamily(
  field: string,
): BigNumber | string | boolean | DomainServiceResolution | null | undefined {
  const route = useRoute<Navigation["route"]>();

  return route.params?.transaction[
    field as keyof typeof route.params.transaction
  ];
}
export function useEditTxFeeByFamily() {
  const transaction = useRoute<Navigation["route"]>().params?.transaction;
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
  status?:
    | {
        errors: Record<string, Error>;
        warnings: Record<string, Error>;
      }
    | null
    | undefined,
  type: "errors" | "warnings" = "errors",
): Error | null {
  if (!status || !status[type]) return null;
  const firstKey = Object.keys(status[type])[0];
  return firstKey ? status[type][firstKey] : null;
}

/**
 *  Returns true if transaction status contains errors
 *
 * @param {Object} status - The transaction status
 */
export function hasStatusError(status: TransactionStatus): boolean {
  if (!status || !status.errors) return false;
  return !!Object.keys(status.errors).length;
}
