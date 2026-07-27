import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import { useAccountBridge } from "../../../bridge/useAccountBridge";
import type { Transaction, TransactionStatus } from "../../../coin-modules/transaction-types";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../types";
import { buildFeePresetLegendMap } from "../utils/feePresetLegends";
import { asFeesStrategy } from "../utils/feesStrategy";
import {
  formatCombinedFeesValue,
  formatDisplayFeesValue,
  getFeePresetEstimationConfig,
  getSelectedPresetFiatValue,
  resolveFeeDisplayContext,
} from "../utils/networkFeesDisplay";
import { useFeePresetFiatValuesCore } from "./useFeePresetFiatValuesCore";
import type { FeeStrategyOption } from "../utils/feeSelectorOptions";

export type { FeeFiatMap } from "./useFeePresetFiatValuesCore";
export type { FeePresetLegendMap } from "../utils/feePresetLegends";
export type { FeeStrategyOption } from "../utils/feeSelectorOptions";

export type UseNetworkFeesCoreParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  fiatUnit: Unit;
  accountUnit: Unit;
  locale?: string;
  calculateCountervalue: (from: Currency, value: BigNumber) => BigNumber | null | undefined;
}>;

export type UseNetworkFeesCoreResult = Readonly<{
  mainAccount: Account;
  accountCurrency: ReturnType<typeof getAccountCurrency>;
  selectedFeeStrategy: string | null;
  selectedPresetFiatValue: string | null;
  displayFeesValue: string;
  formattedEstimatedFeesFiat: string | null;
  selectedFeeStrategyId: string;
  feeStrategyOptions: readonly FeeStrategyOption[];
  onSelectFeeStrategyId: (id: string) => void;
  hasCustomFees: boolean;
  hasCoinControl: boolean;
  showFeeCurrencyAmount: boolean;
}>;

export function useNetworkFeesCore({
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
}: UseNetworkFeesCoreParams): UseNetworkFeesCoreResult {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const presetEstimation = useMemo(
    () => getFeePresetEstimationConfig(accountCurrency, transaction),
    [accountCurrency, transaction],
  );

  const fiatByPreset = useFeePresetFiatValuesCore({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions: presetEstimation.feePresetOptions,
    fallbackPresetIds: presetEstimation.fallbackPresetIds,
    fiatUnit,
    locale,
    enabled: uiConfig.hasFeePresets && presetEstimation.hasFeePresets,
    shouldEstimateWithBridge: presetEstimation.shouldEstimateFeePresets,
    allowZeroAmountEstimation: presetEstimation.allowZeroAmountEstimation,
    calculateCountervalue,
  });

  const legendByPreset = useMemo(
    () => buildFeePresetLegendMap(accountCurrency, presetEstimation.feePresetOptions),
    [accountCurrency, presetEstimation.feePresetOptions],
  );

  const feeCurrencyAccountId = sendFeatures.getFeeCurrencyAccountId(accountCurrency, transaction);
  const { displayUnit, displayCurrency } = useMemo(
    () =>
      resolveFeeDisplayContext({
        mainAccount,
        accountCurrency,
        accountUnit,
        feeCurrencyAccountId,
      }),
    [accountCurrency, accountUnit, feeCurrencyAccountId, mainAccount],
  );

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );
  const estimatedFeesCountervalue = useMemo(
    () => calculateCountervalue(displayCurrency, estimatedFees),
    [calculateCountervalue, displayCurrency, estimatedFees],
  );
  // Coin-declared opt-in: append the fee amount in its own currency next to fiat.
  const showFeeCurrencyAmount = sendFeatures.showFeeCurrencyAmount(accountCurrency);
  // A zero fee only means "covered" once fees are actually estimated. Estimation can be skipped
  // while the transaction has errors, leaving a defaulted 0 — fall back to the default display so
  // an unknown fee is not shown as a confirmed zero. A non-finite estimate is likewise unknown.
  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const useCombinedFeesValue =
    showFeeCurrencyAmount && estimatedFees.isFinite() && !(hasErrors && estimatedFees.lte(0));
  const { displayFeesValue, formattedEstimatedFeesFiat } = useMemo(
    () =>
      (useCombinedFeesValue ? formatCombinedFeesValue : formatDisplayFeesValue)({
        estimatedFees,
        estimatedFeesCountervalue,
        fiatUnit,
        displayUnit,
        locale,
      }),
    [displayUnit, estimatedFees, estimatedFeesCountervalue, fiatUnit, locale, useCombinedFeesValue],
  );

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => bridge.updateTransaction(currentTx, patch));
    },
    [bridge, transactionActions],
  );

  const selectedFeeStrategy = transaction.feesStrategy ?? null;
  const selectedPresetFiatValue = getSelectedPresetFiatValue(selectedFeeStrategy, fiatByPreset);

  const feeStrategyOptions = useMemo<readonly FeeStrategyOption[]>(() => {
    if (!uiConfig.hasFeePresets) {
      return uiConfig.hasDefaultStrategy
        ? [{ id: "default", kind: "default", sublabelFiat: null, sublabelLegend: null }]
        : [];
    }

    const presetIds =
      presetEstimation.feePresetOptions.length > 0
        ? presetEstimation.feePresetOptions.map(option => option.id)
        : (presetEstimation.fallbackPresetIds ?? []);

    return presetIds.map(id => ({
      id,
      kind: "preset" as const,
      sublabelFiat: fiatByPreset[id] ?? null,
      sublabelLegend: legendByPreset[id] ?? null,
    }));
  }, [
    fiatByPreset,
    legendByPreset,
    presetEstimation.fallbackPresetIds,
    presetEstimation.feePresetOptions,
    uiConfig.hasDefaultStrategy,
    uiConfig.hasFeePresets,
  ]);

  const selectedFeeStrategyId = useMemo(() => {
    const presetIds = feeStrategyOptions.filter(o => o.kind === "preset").map(o => o.id);
    const hasDefault = feeStrategyOptions.some(o => o.kind === "default");

    if (selectedFeeStrategy === "custom" && uiConfig.hasCustomFees) return "custom";
    if (selectedFeeStrategy && presetIds.includes(selectedFeeStrategy)) return selectedFeeStrategy;
    if (presetIds.length > 0) return presetIds.includes("medium") ? "medium" : presetIds[0];
    if (hasDefault) return "default";
    return "";
  }, [feeStrategyOptions, selectedFeeStrategy, uiConfig.hasCustomFees]);

  const onSelectFeeStrategyId = useCallback(
    (id: string) => {
      if (id === "default") {
        const patch = sendFeatures.getDefaultStrategyPatch(accountCurrency);
        updateTransactionWithPatch((patch ?? {}) as Partial<Transaction>);
      } else {
        updateTransactionWithPatch({ feesStrategy: asFeesStrategy(id) });
      }
    },
    [accountCurrency, updateTransactionWithPatch],
  );

  return {
    mainAccount,
    accountCurrency,
    selectedFeeStrategy,
    selectedPresetFiatValue,
    displayFeesValue,
    formattedEstimatedFeesFiat,
    selectedFeeStrategyId,
    feeStrategyOptions,
    onSelectFeeStrategyId,
    hasCustomFees: uiConfig.hasCustomFees,
    hasCoinControl: uiConfig.hasCoinControl,
    showFeeCurrencyAmount,
  };
}
