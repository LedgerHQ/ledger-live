import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import type { Currency } from "@domain/entity-currency";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import { useAccountBridge } from "../../../bridge/useAccountBridge";
import type { Transaction, TransactionStatus } from "../../../coin-modules/transaction-types";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../types";
import { buildFeePresetLegendMap } from "../utils/feePresetLegends";
import { asFeesStrategy } from "../utils/feesStrategy";
import {
  formatFeesValue,
  getFeePresetEstimationConfig,
  resolveFeeDisplayContext,
} from "../utils/networkFeesDisplay";
import type { FeesValueMode } from "../utils/networkFeesDisplay";
import { useFeePresetValuesCore } from "./useFeePresetValuesCore";
import type { SendAmountDisplayMode } from "../amount/SendAmountDisplayModeContext";
import type { FeeStrategyOption } from "../utils/feeSelectorOptions";

export type { FeePresetValueMap, FeePresetValues } from "./useFeePresetValuesCore";
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
  /** The amount input's fiat⇄crypto toggle, which the fee row follows when fees are editable. */
  displayMode: SendAmountDisplayMode;
  calculateCountervalue: (from: Currency, value: BigNumber) => BigNumber | null | undefined;
}>;

export type UseNetworkFeesCoreResult = Readonly<{
  mainAccount: Account;
  accountCurrency: ReturnType<typeof getAccountCurrency>;
  selectedFeeStrategy: string | null;
  /** Ready-to-render fee row value. `"-"` when unknown; apps localise that placeholder themselves. */
  feesRowValue: string;
  /** Native amount shown after `feesRowValue` in the dimmer colour; `null` unless fees are read-only. */
  feesRowSecondaryValue: string | null;
  selectedFeeStrategyId: string;
  feeStrategyOptions: readonly FeeStrategyOption[];
  onSelectFeeStrategyId: (id: string) => void;
  hasCustomFees: boolean;
  hasCoinControl: boolean;
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
  displayMode,
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

  const valuesByPreset = useFeePresetValuesCore({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions: presetEstimation.feePresetOptions,
    fallbackPresetIds: presetEstimation.fallbackPresetIds,
    fiatUnit,
    displayUnit,
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

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );
  const estimatedFeesCountervalue = useMemo(
    () => calculateCountervalue(displayCurrency, estimatedFees),
    [calculateCountervalue, displayCurrency, estimatedFees],
  );

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => bridge.updateTransaction(currentTx, patch));
    },
    [bridge, transactionActions],
  );

  const selectedFeeStrategy = transaction.feesStrategy ?? null;

  const feeStrategyOptions = useMemo<readonly FeeStrategyOption[]>(() => {
    if (!uiConfig.hasFeePresets) {
      return uiConfig.hasDefaultStrategy
        ? [
            {
              id: "default",
              kind: "default",
              sublabelFiat: null,
              sublabelCrypto: null,
              sublabelLegend: null,
            },
          ]
        : [];
    }

    const presetIds =
      presetEstimation.feePresetOptions.length > 0
        ? presetEstimation.feePresetOptions.map(option => option.id)
        : (presetEstimation.fallbackPresetIds ?? []);

    return presetIds.map(id => ({
      id,
      kind: "preset" as const,
      sublabelFiat: valuesByPreset[id]?.fiat ?? null,
      sublabelCrypto: valuesByPreset[id]?.crypto ?? null,
      sublabelLegend: legendByPreset[id] ?? null,
    }));
  }, [
    legendByPreset,
    presetEstimation.fallbackPresetIds,
    presetEstimation.feePresetOptions,
    uiConfig.hasDefaultStrategy,
    uiConfig.hasFeePresets,
    valuesByPreset,
  ]);

  const areFeesEditable =
    feeStrategyOptions.length > 0 || uiConfig.hasCustomFees || uiConfig.hasCoinControl;

  // A zero fee only means "covered" once fees are actually estimated. Estimation can be skipped
  // while the transaction has errors, leaving a defaulted 0 — fall back to the single-value display
  // so an unknown fee is not shown as a confirmed zero. A non-finite estimate is likewise unknown.
  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const canTrustZeroFee = estimatedFees.isFinite() && !(hasErrors && estimatedFees.lte(0));
  const requestedMode: FeesValueMode = areFeesEditable ? displayMode : "both";
  const feesValueMode: FeesValueMode =
    requestedMode === "both" && !canTrustZeroFee ? "fiat" : requestedMode;

  const { displayFeesValue, secondaryFeesValue } = useMemo(
    () =>
      formatFeesValue({
        estimatedFees,
        estimatedFeesCountervalue,
        fiatUnit,
        displayUnit,
        locale,
        mode: feesValueMode,
      }),
    [displayUnit, estimatedFees, estimatedFeesCountervalue, feesValueMode, fiatUnit, locale],
  );

  // The selected preset's own estimate takes precedence: for bridge-estimated presets (EVM) the
  // transaction status can still hold the previous strategy's fee right after a switch. Non-editable
  // coins have no presets, so this can never shadow the two-value display.
  const selectedPresetValues =
    selectedFeeStrategy && selectedFeeStrategy !== "custom"
      ? (valuesByPreset[selectedFeeStrategy] ?? null)
      : null;
  const selectedPresetDisplayValue = !areFeesEditable
    ? null
    : displayMode === "crypto"
      ? (selectedPresetValues?.crypto ?? null)
      : (selectedPresetValues?.fiat ?? null);

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
    feesRowValue: selectedPresetDisplayValue ?? displayFeesValue,
    feesRowSecondaryValue: secondaryFeesValue,
    selectedFeeStrategyId,
    feeStrategyOptions,
    onSelectFeeStrategyId,
    hasCustomFees: uiConfig.hasCustomFees,
    hasCoinControl: uiConfig.hasCoinControl,
  };
}
