import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, Currency, Unit } from "@domain/entity-currency";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import { useAccountBridge } from "../../../bridge/useAccountBridge";
import type { Transaction, TransactionStatus } from "../../../coin-modules/transaction-types";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../types";
import { buildFeePresetLegendMap, type FeePresetLegendMap } from "../utils/feePresetLegends";
import { asFeesStrategy } from "../utils/feesStrategy";
import {
  formatCombinedFeesValue,
  formatDisplayFeesValue,
  getFeePresetEstimationConfig,
  getSelectedPresetFiatValue,
  resolveFeeDisplayContext,
} from "../utils/networkFeesDisplay";
import { useFeePresetFiatValuesCore, type FeeFiatMap } from "./useFeePresetFiatValuesCore";

export type { FeeFiatMap, FeePresetLegendMap };

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
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  selectedFeeStrategy: string | null;
  selectedPresetFiatValue: string | null;
  onSelectFeeStrategy: (strategy: string) => void;
  displayFeesValue: string;
  formattedEstimatedFeesFiat: string | null;
  showFeePresets: boolean;
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
  const domainAccountCurrency = accountCurrency as unknown as CryptoOrTokenCurrency;
  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const presetEstimation = useMemo(
    () => getFeePresetEstimationConfig(domainAccountCurrency, transaction),
    [domainAccountCurrency, transaction],
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
    () => buildFeePresetLegendMap(domainAccountCurrency, presetEstimation.feePresetOptions),
    [domainAccountCurrency, presetEstimation.feePresetOptions],
  );

  const feeCurrencyAccountId = sendFeatures.getFeeCurrencyAccountId(
    domainAccountCurrency,
    transaction,
  );
  const { displayUnit, displayCurrency } = useMemo(
    () =>
      resolveFeeDisplayContext({
        mainAccount,
        accountCurrency: domainAccountCurrency,
        accountUnit,
        feeCurrencyAccountId,
      }),
    [domainAccountCurrency, accountUnit, feeCurrencyAccountId, mainAccount],
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

  const onSelectFeeStrategy = useCallback(
    (strategy: string) => {
      updateTransactionWithPatch({ feesStrategy: asFeesStrategy(strategy) });
    },
    [updateTransactionWithPatch],
  );

  return {
    mainAccount,
    accountCurrency,
    feePresetOptions: presetEstimation.feePresetOptions,
    fiatByPreset,
    legendByPreset,
    selectedFeeStrategy,
    selectedPresetFiatValue,
    onSelectFeeStrategy,
    displayFeesValue,
    formattedEstimatedFeesFiat,
    showFeePresets: uiConfig.hasFeePresets,
    showFeeCurrencyAmount,
  };
}
