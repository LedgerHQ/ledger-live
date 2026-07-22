import { useCallback, useMemo } from "react";
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
import { asFeesStrategy } from "@ledgerhq/live-common/flows/send/utils/feesStrategy";
import { useNetworkFeesCore } from "@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { NetworkFeesViewModel } from "../types";

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
      const resolved = asFeesStrategy(strategy ?? "medium");
      return t(`send.fees.${resolved ?? "medium"}`);
    },
    [t],
  );

  const networkFeesInfo = useMemo(
    () => sendFeatures.getNetworkFeesInfo(accountCurrency, { transaction, status }),
    [accountCurrency, transaction, status],
  );

  const feePresetOptionsMapped = useMemo(
    () =>
      core.feePresetOptions.map(opt => ({
        id: opt.id,
        label: t(`send.fees.${opt.id}`),
        fiatValue: core.fiatByPreset[opt.id] ?? null,
        legendValue: null,
      })),
    [core.feePresetOptions, core.fiatByPreset, t],
  );

  return useMemo(
    () => ({
      label: t("send.fees.title"),
      value: core.displayFeesValue,
      strategyLabel: getFeeStrategyLabel(core.selectedFeeStrategy),
      showFeeCurrencyAmount: core.showFeeCurrencyAmount,
      showFeePresets: core.showFeePresets,
      selectedFeeStrategy: core.selectedFeeStrategy,
      feePresetLabelsOptions: feePresetOptionsMapped,
      onSelectFeeStrategy: core.onSelectFeeStrategy,
      onSelectCoinControl,
      onSelectCustomFees,
      uiConfig: {
        hasCustomFees: uiConfig.hasCustomFees,
        hasCoinControl: uiConfig.hasCoinControl,
      },
      networkFeesInfo,
    }),
    [
      core.displayFeesValue,
      core.selectedFeeStrategy,
      core.showFeeCurrencyAmount,
      core.showFeePresets,
      core.onSelectFeeStrategy,
      feePresetOptionsMapped,
      getFeeStrategyLabel,
      onSelectCoinControl,
      onSelectCustomFees,
      t,
      uiConfig.hasCoinControl,
      uiConfig.hasCustomFees,
      networkFeesInfo,
    ],
  );
}
