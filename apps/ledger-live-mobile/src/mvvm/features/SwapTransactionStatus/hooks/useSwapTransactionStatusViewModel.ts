import { useMemo } from "react";
import {
  type SwapTransactionStatusParams,
  useSwapTransactionStatusDisplayViewModel,
  type SwapTransactionStatusTransactionExplorerBuilder,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "~/context/hooks";
import byFamiliesOperationDetails from "~/generated/operationDetails";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { localeSelector } from "~/reducers/settings";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useSwapTransactionStatus } from "./useSwapTransactionStatus";

export function useSwapTransactionStatusViewModel({
  params,
  onClose,
}: {
  params: SwapTransactionStatusParams;
  onClose: () => void;
}) {
  const transactionStatus = useSwapTransactionStatus({ params, onClose });
  const accounts = useSelector(flattenAccountsSelector);
  const locale = useSelector(localeSelector);

  return useSwapTransactionStatusDisplayViewModel({
    params,
    transactionStatus,
    accounts,
    locale,
    useReceiveAccountName: useMaybeAccountName,
    useTransactionExplorerBuilder: useMobileTransactionExplorerBuilder,
  });
}

export type SwapTransactionStatusViewModel = ReturnType<typeof useSwapTransactionStatusViewModel>;

function useMobileTransactionExplorerBuilder(
  currency: CryptoCurrency | undefined,
): SwapTransactionStatusTransactionExplorerBuilder | undefined {
  return useMemo(() => {
    if (!currency) return undefined;
    const familyDetails =
      byFamiliesOperationDetails[currency.family as keyof typeof byFamiliesOperationDetails];

    return familyDetails && "getTransactionExplorer" in familyDetails
      ? (familyDetails.getTransactionExplorer as SwapTransactionStatusTransactionExplorerBuilder)
      : undefined;
  }, [currency]);
}
