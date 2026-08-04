import { useMemo } from "react";
import { useTranslation, useLocale } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { useNetworkFeesCore } from "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { feeSelectorLabelKeySuffix } from "@ledgerhq/live-common/flows/send/utils/feeStrategyLabels";
import { buildFeeSelectorOptions } from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";
import type { FeeSelectorOption, NetworkFeesViewModel } from "../types";

type UseNetworkFeesParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onSelectCoinControl?: () => void;
  onSelectCustomFees?: () => void;
}>;

export function useNetworkFees({
  account,
  parentAccount,
  transaction,
  status,
  uiConfig,
  transactionActions,
  onSelectCoinControl,
  onSelectCustomFees,
}: UseNetworkFeesParams): NetworkFeesViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
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

  const networkFeesInfo = useMemo(
    () => sendFeatures.getNetworkFeesInfo(accountCurrency, { transaction, status }),
    [accountCurrency, transaction, status],
  );

  const displayOptions = useMemo<readonly FeeSelectorOption[]>(
    () =>
      buildFeeSelectorOptions({
        strategyOptions: core.feeStrategyOptions,
        selectedFeeStrategyId: core.selectedFeeStrategyId,
        onSelectFeeStrategyId: core.onSelectFeeStrategyId,
        labelFor: option =>
          t(option.kind === "default" ? "send.fees.defaultNetworkFee" : `send.fees.${option.id}`),
        sublabelFor: option => option.sublabelFiat,
        custom: {
          enabled: core.hasCustomFees,
          label: t("send.fees.customFees"),
          onSelect: onSelectCustomFees,
        },
        coinControl: {
          enabled: core.hasCoinControl,
          label: t("send.fees.coinControl"),
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
      t,
    ],
  );

  return useMemo(
    () => ({
      label: t("send.fees.title"),
      value: core.displayFeesValue,
      strategyLabel: t(`send.fees.${feeSelectorLabelKeySuffix(core.selectedFeeStrategyId)}`),
      showFeeCurrencyAmount: core.showFeeCurrencyAmount,
      selectedFeeStrategy: core.selectedFeeStrategy,
      displayOptions,
      canOpenSelector: displayOptions.length > 0,
      networkFeesInfo,
    }),
    [
      core.displayFeesValue,
      core.selectedFeeStrategy,
      core.selectedFeeStrategyId,
      core.showFeeCurrencyAmount,
      displayOptions,
      networkFeesInfo,
      t,
    ],
  );
}
