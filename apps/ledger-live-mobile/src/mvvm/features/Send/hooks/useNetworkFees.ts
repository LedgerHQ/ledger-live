import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation, useLocale } from "~/context/Locale";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useFeePresetOptions } from "./useFeePresetOptions";
import { useFeePresetFiatValues } from "./useFeePresetFiatValues";
import type { NetworkFeesViewModel } from "../types";

type FeesStrategy = NonNullable<Transaction["feesStrategy"]>;
function isFeesStrategy(s: string): s is FeesStrategy {
  return s === "slow" || s === "medium" || s === "fast" || s === "custom";
}
const asFeesStrategy = (s: string): FeesStrategy | null => (isFeesStrategy(s) ? s : null);

type UseNetworkFeesParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onSelectCoinControl?: () => void;
}>;

export function useNetworkFees({
  account,
  parentAccount,
  transaction,
  status,
  uiConfig,
  transactionActions,
  onSelectCoinControl,
}: UseNetworkFeesParams): NetworkFeesViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];

  const feeCurrencyAccountId = sendFeatures.getFeeCurrencyAccountId(accountCurrency, transaction);

  const feeCurrencySubAccount = useMemo<TokenAccount | null>(() => {
    if (!feeCurrencyAccountId) return null;
    const found = (mainAccount.subAccounts ?? []).find(
      (sub): sub is TokenAccount =>
        sub.id === feeCurrencyAccountId && sub.type === "TokenAccount",
    );
    return found ?? null;
  }, [feeCurrencyAccountId, mainAccount.subAccounts]);

  const displayUnit = feeCurrencySubAccount?.token.units[0] ?? accountUnit;
  const displayCurrency = feeCurrencySubAccount?.token ?? accountCurrency;

  const feePresetOptions = useFeePresetOptions(accountCurrency, transaction);
  const hasFeePresets = uiConfig.hasFeePresets;
  const shouldEstimateFeePresetsWithBridge = sendFeatures.shouldEstimateFeePresetsWithBridge(
    accountCurrency,
    transaction,
  );
  const shouldForceBridgeEstimationForEvm =
    hasFeePresets && transaction.family === "evm" && feePresetOptions.length === 0;
  const shouldEstimateFeePresets =
    shouldEstimateFeePresetsWithBridge || shouldForceBridgeEstimationForEvm;

  const feePresetFiatValues = useFeePresetFiatValues({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions,
    fallbackPresetIds: shouldForceBridgeEstimationForEvm ? ["slow", "medium", "fast"] : undefined,
    counterValueCurrency,
    fiatUnit,
    locale,
    enabled: hasFeePresets,
    shouldEstimateWithBridge: shouldEstimateFeePresets,
  });

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [bridge, transactionActions],
  );

  const selectedFeeStrategy = transaction.feesStrategy ?? null;

  const onSelectFeeStrategy = useCallback(
    (strategy: string) => {
      updateTransactionWithPatch({ feesStrategy: asFeesStrategy(strategy) });
    },
    [updateTransactionWithPatch],
  );

  const getFeeStrategyLabel = useCallback(
    (strategy: string | null): string => {
      const s = asFeesStrategy(strategy ?? "medium");
      return t(`send.fees.${s}`);
    },
    [t],
  );

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );

  const estimatedFeesCountervalue = useCalculate({
    from: displayCurrency,
    to: counterValueCurrency,
    value: estimatedFees.toNumber(),
    disableRounding: true,
  });

  const feesValue = useMemo(() => {
    if (estimatedFees.lte(0)) return "-";

    const fiatAmount = new BigNumber(estimatedFeesCountervalue ?? 0);
    if (fiatAmount.gt(0)) {
      return formatCurrencyUnit(fiatUnit, fiatAmount, {
        showCode: true,
        disableRounding: true,
        locale,
      });
    }

    return formatCurrencyUnit(displayUnit, estimatedFees, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [estimatedFees, estimatedFeesCountervalue, fiatUnit, displayUnit, locale]);

  const feePresetOptionsMapped = useMemo(() => {
    return feePresetOptions.map(opt => ({
      id: opt.id,
      label: t(`send.fees.${opt.id}`),
      fiatValue: feePresetFiatValues[opt.id] ?? null,
      legendValue: null,
    }));
  }, [feePresetOptions, t, feePresetFiatValues]);

  return useMemo(
    () => ({
      label: t("send.fees.title"),
      value: feesValue,
      strategyLabel: getFeeStrategyLabel(selectedFeeStrategy),
      showFeePresets: uiConfig.hasFeePresets,
      selectedFeeStrategy,
      feePresetLabelsOptions: feePresetOptionsMapped,
      onSelectFeeStrategy,
      onSelectCoinControl,
      uiConfig: {
        hasCustomFees: uiConfig.hasCustomFees,
        hasCoinControl: uiConfig.hasCoinControl,
      },
    }),
    [
      t,
      feesValue,
      getFeeStrategyLabel,
      selectedFeeStrategy,
      uiConfig.hasFeePresets,
      uiConfig.hasCustomFees,
      uiConfig.hasCoinControl,
      feePresetOptionsMapped,
      onSelectFeeStrategy,
      onSelectCoinControl,
    ],
  );
}
