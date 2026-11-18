import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import {
  type SwapTransactionStatusParams,
  useSwapTransactionStatusDisplayViewModel,
  type SwapTransactionStatusTransactionExplorerBuilder,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useSelector } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useSwapTransactionStatus } from "./useSwapTransactionStatus";

export function useSwapTransactionStatusViewModel(params: SwapTransactionStatusParams) {
  const transactionStatus = useSwapTransactionStatus(params);
  const accounts = useSelector(accountsSelector);
  const locale = useSelector(localeSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const { t } = useTranslation();

  const viewModel = useSwapTransactionStatusDisplayViewModel({
    params,
    transactionStatus,
    accounts: flattenedAccounts,
    locale,
    useReceiveAccountName: useMaybeAccountName,
    useTransactionExplorerBuilder: useDesktopTransactionExplorerBuilder,
  });

  // A withdraw is titled as such wherever it is opened from, Swap History included.
  const title = viewModel.isPerpsWithdraw ? t("perpsTransactionStatus.withdrawTitle") : undefined;

  return { ...viewModel, title };
}

export type SwapTransactionStatusViewModel = ReturnType<typeof useSwapTransactionStatusViewModel>;

function useDesktopTransactionExplorerBuilder(
  currency: CryptoCurrency | undefined,
): SwapTransactionStatusTransactionExplorerBuilder | undefined {
  return useLLDCoinFamily(currency?.family).getTransactionExplorer;
}
