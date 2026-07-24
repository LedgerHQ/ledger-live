import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import {
  useNetworkFeesCore,
  type FeeFiatMap,
  type FeePresetLegendMap,
} from "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore";

export type { FeeFiatMap, FeePresetLegendMap };

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
  const locale = useSelector(localeSelector);
  const fiatUnit = counterValueCurrency.units[0];
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const core = useNetworkFeesCore({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    fiatUnit,
    accountUnit,
    locale,
    calculateCountervalue,
  });

  const getFeeStrategyLabel = useCallback(
    (strategy: string | null): string => {
      if (!strategy) return t("fees.medium");
      if (strategy === "custom") return t("fees.custom");
      return t(`fees.${strategy}`);
    },
    [t],
  );

  return useMemo(
    () => ({
      feesRowLabel: t("fees.networkFees"),
      // A selected preset's fiat value takes precedence here. Coins using `showFeeCurrencyAmount`
      // have no fee presets today, so this never drops the combined value; revisit if that changes.
      feesRowValue:
        core.selectedPresetFiatValue ??
        (core.displayFeesValue === "-" ? "--" : core.displayFeesValue),
      feesRowStrategyLabel: getFeeStrategyLabel(core.selectedFeeStrategy),
      showNetworkFees: true,
      showFeePresets: core.showFeePresets,
      selectedFeeStrategy: core.selectedFeeStrategy,
      onSelectFeeStrategy: core.onSelectFeeStrategy,
      feePresetOptions: core.feePresetOptions,
      fiatByPreset: core.fiatByPreset,
      legendByPreset: core.legendByPreset,
    }),
    [core, getFeeStrategyLabel, t],
  );
}

export type NetworkFeesViewModel = ReturnType<typeof useNetworkFees>;
