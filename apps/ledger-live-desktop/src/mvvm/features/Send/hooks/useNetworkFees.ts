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
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useNetworkFeesCore } from "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore";
import { feeSelectorLabelKeySuffix } from "@ledgerhq/live-common/flows/send/utils/feeStrategyLabels";
import { buildFeeSelectorOptions } from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";
import type { FeeSelectorOption } from "../screens/Amount/types";

type UseNetworkFeesParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onSelectCustomFees?: () => void;
  onSelectCoinControl?: () => void;
}>;

export function useNetworkFees({
  account,
  parentAccount,
  transaction,
  status,
  uiConfig,
  transactionActions,
  onSelectCustomFees,
  onSelectCoinControl,
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
  const calculateCountervalue = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

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

  const shouldShowFeeRateLegend = sendFeatures.hasFeeRateLegend(accountCurrency);

  const displayOptions = useMemo<readonly FeeSelectorOption[]>(
    () =>
      buildFeeSelectorOptions({
        strategyOptions: core.feeStrategyOptions,
        selectedFeeStrategyId: core.selectedFeeStrategyId,
        onSelectFeeStrategyId: core.onSelectFeeStrategyId,
        labelFor: option =>
          t(`fees.${feeSelectorLabelKeySuffix(option.id)}`, {
            defaultValue: option.id.toUpperCase(),
          }),
        sublabelFor: option =>
          shouldShowFeeRateLegend ? option.sublabelLegend : option.sublabelFiat,
        custom: {
          enabled: core.hasCustomFees,
          label: t("fees.custom"),
          onSelect: onSelectCustomFees,
        },
        coinControl: {
          enabled: core.hasCoinControl,
          label: t("fees.coinControl"),
          onSelect: onSelectCoinControl,
        },
      }),
    [
      core.feeStrategyOptions,
      core.hasCoinControl,
      core.hasCustomFees,
      core.onSelectFeeStrategyId,
      core.selectedFeeStrategyId,
      onSelectCoinControl,
      onSelectCustomFees,
      shouldShowFeeRateLegend,
      t,
    ],
  );

  return useMemo(
    () => ({
      feesRowLabel: t("fees.networkFees"),
      // A selected preset's fiat value takes precedence here. Coins using `showFeeCurrencyAmount`
      // have no fee presets today, so this never drops the combined value; revisit if that changes.
      feesRowValue:
        core.selectedPresetFiatValue ??
        (core.displayFeesValue === "-" ? "--" : core.displayFeesValue),
      feesRowStrategyLabel: t(`fees.${feeSelectorLabelKeySuffix(core.selectedFeeStrategyId)}`, {
        defaultValue: core.selectedFeeStrategyId.toUpperCase(),
      }),
      showNetworkFees: true,
      selectedFeeStrategy: core.selectedFeeStrategy,
      feeSelector: {
        options: displayOptions,
        selectedId: core.selectedFeeStrategyId,
        canOpen: displayOptions.length > 0,
      },
    }),
    [core, displayOptions, t],
  );
}

export type NetworkFeesViewModel = ReturnType<typeof useNetworkFees>;
export type { FeeSelectorOption };
