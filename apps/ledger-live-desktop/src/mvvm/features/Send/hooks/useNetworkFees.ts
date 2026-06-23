import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useFeeInfo } from "./useFeeInfo";
import { useFeePresetFiatValues } from "./useFeePresetFiatValues";
import { useFeePresetLegends } from "./useFeePresetLegends";
import { useFeePresetOptions } from "./useFeePresetOptions";

type UseNetworkFeesParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

export function useNetworkFees({
  account,
  parentAccount,
  transaction,
  status,
  uiConfig,
  transactionActions,
}: UseNetworkFeesParams) {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatUnit = counterValueCurrency.units[0];
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const feePresetOptions = useFeePresetOptions(accountCurrency, transaction);
  const hasFeePresets = sendFeatures.hasFeePresets(accountCurrency);
  const shouldEstimateFeePresetsWithBridge = sendFeatures.shouldEstimateFeePresetsWithBridge(
    accountCurrency,
    transaction,
  );
  const fallbackPresetIds = sendFeatures.getFeePresetFallbackIds(accountCurrency, transaction);
  const shouldEstimateFallbackPresetsWithBridge =
    hasFeePresets && feePresetOptions.length === 0 && fallbackPresetIds.length > 0;

  const shouldEstimateFeePresets =
    shouldEstimateFeePresetsWithBridge || shouldEstimateFallbackPresetsWithBridge;

  const fiatByPreset = useFeePresetFiatValues({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions,
    fallbackPresetIds: shouldEstimateFallbackPresetsWithBridge ? fallbackPresetIds : undefined,
    counterValueCurrency,
    fiatUnit,
    enabled: hasFeePresets,
    shouldEstimateWithBridge: shouldEstimateFeePresets,
    allowZeroAmountEstimation: sendFeatures.canEstimateFeePresetsWithZeroAmount(
      accountCurrency,
      transaction,
    ),
  });
  const legendByPreset = useFeePresetLegends({
    currency: accountCurrency,
    feePresetOptions,
  });

  const feeCurrencyAccountId = sendFeatures.getFeeCurrencyAccountId(accountCurrency, transaction);

  const { feeSummary } = useFeeInfo({
    account,
    parentAccount,
    status,
    feeCurrencyAccountId,
  });

  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [bridge, transactionActions],
  );

  const showNetworkFees = true;

  const selectedFeeStrategy = transaction.feesStrategy ?? null;
  const selectedPresetFiatValue =
    selectedFeeStrategy && selectedFeeStrategy !== "custom"
      ? fiatByPreset[selectedFeeStrategy] ?? null
      : null;

  const onSelectFeeStrategy = useCallback(
    (strategy: string) => {
      const feesStrategy: Transaction["feesStrategy"] =
        strategy === "slow" || strategy === "medium" || strategy === "fast" || strategy === "custom"
          ? strategy
          : null;

      updateTransactionWithPatch({ feesStrategy });
    },
    [updateTransactionWithPatch],
  );

  const getFeeStrategyLabel = (strategy: string | null): string => {
    if (!strategy) return t("fees.medium");
    if (strategy === "custom") return t("fees.custom");
    return t(`fees.${strategy}`);
  };

  return {
    feesRowLabel: t("fees.networkFees"),
    feesRowValue: selectedPresetFiatValue ?? feeSummary?.fiatValue ?? "--",
    feesRowStrategyLabel: getFeeStrategyLabel(selectedFeeStrategy),
    showNetworkFees,
    showFeePresets: uiConfig.hasFeePresets,
    selectedFeeStrategy,
    onSelectFeeStrategy,
    feePresetOptions,
    fiatByPreset,
    legendByPreset,
  };
}

export type NetworkFeesViewModel = ReturnType<typeof useNetworkFees>;
