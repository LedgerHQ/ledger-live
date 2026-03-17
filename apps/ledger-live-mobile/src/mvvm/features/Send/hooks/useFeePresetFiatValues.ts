import { useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { FeePresetOption } from "./useFeePresetOptions";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";

function getFeesStrategyForPreset(presetId: string): Transaction["feesStrategy"] | null {
  if (presetId === "slow") return "slow";
  if (presetId === "medium") return "medium";
  if (presetId === "fast") return "fast";
  if (presetId === "custom") return "custom";
  return null;
}

function formatCountervalueAsFiat(
  fiatUnit: Unit,
  countervalue: BigNumber | null | undefined,
  locale: string,
): string | null {
  return countervalue !== null && countervalue !== undefined
    ? formatCurrencyUnit(fiatUnit, countervalue, {
        showCode: true,
        disableRounding: true,
        locale,
      })
    : null;
}

export type FeeFiatMap = Readonly<Record<string, string | null>>;

type Params = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  mainAccount: Account;
  transaction: Transaction;
  feePresetOptions: readonly FeePresetOption[];
  fallbackPresetIds?: readonly string[];
  counterValueCurrency: Currency;
  fiatUnit: Unit;
  locale: string;
  enabled: boolean;
  shouldEstimateWithBridge: boolean;
}>;

async function estimateFiatValuesForPresets(params: {
  bridge: ReturnType<typeof getAccountBridge>;
  mainAccount: Account;
  transaction: Transaction;
  presetIds: readonly string[];
  convertCountervalue: (currency: Currency, value: BigNumber) => BigNumber | null | undefined;
  fiatUnit: Unit;
  locale: string;
  requestId: number;
  requestIdRef: React.RefObject<number>;
  setFiatByPreset: (value: FeeFiatMap) => void;
}): Promise<void> {
  try {
    const entries = await Promise.all(
      params.presetIds.map(async presetId => {
        const feesStrategy = getFeesStrategyForPreset(presetId);
        const txWithStrategy = params.bridge.updateTransaction(params.transaction, {
          feesStrategy,
        });
        const preparedTx = await params.bridge.prepareTransaction(
          params.mainAccount,
          txWithStrategy,
        );
        const status = await params.bridge.getTransactionStatus(params.mainAccount, preparedTx);
        const estimatedFees = status.estimatedFees ?? new BigNumber(0);

        const countervalue = params.convertCountervalue(params.mainAccount.currency, estimatedFees);
        const fiatValue = formatCountervalueAsFiat(params.fiatUnit, countervalue, params.locale);

        return [presetId, fiatValue] as const;
      }),
    );

    if (params.requestIdRef.current !== params.requestId) {
      return;
    }

    const next: Record<string, string | null> = {};
    for (const [id, value] of entries) {
      next[id] = value;
    }

    params.setFiatByPreset(next);
  } catch (error) {
    console.error("❌ Failed to estimate fee preset fiat values:", error);
  }
}

/**
 * Calculates fiat countervalues for fee presets
 * Uses bridge to estimate fees for each strategy (slow/medium/fast)
 */
export function useFeePresetFiatValues({
  account,
  parentAccount,
  mainAccount,
  transaction,
  feePresetOptions,
  fallbackPresetIds,
  counterValueCurrency,
  fiatUnit,
  locale,
  enabled,
  shouldEstimateWithBridge,
}: Params): FeeFiatMap {
  const convertCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const [fiatByPreset, setFiatByPreset] = useState<FeeFiatMap>({});

  const recipient = transaction.recipient ?? "";
  const amount = useMemo(() => transaction.amount ?? new BigNumber(0), [transaction.amount]);
  const useAllAmount = Boolean(transaction.useAllAmount);

  const presetIds = useMemo(
    () => (feePresetOptions.length > 0 ? feePresetOptions.map(o => o.id) : fallbackPresetIds ?? []),
    [fallbackPresetIds, feePresetOptions],
  );

  // Simple key for memoization
  const key = useMemo(
    () => `${mainAccount.id}-${recipient}-${amount.toString()}-${useAllAmount}`,
    [mainAccount.id, recipient, amount, useAllAmount],
  );

  const lastKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  // Check if we can use direct values from preset options (faster)
  const directFiatValues = useMemo<FeeFiatMap>(() => {
    if (!enabled || feePresetOptions.length === 0 || shouldEstimateWithBridge) {
      return {};
    }

    // If presets have direct amounts, use them
    const next: Record<string, string | null> = {};
    for (const option of feePresetOptions) {
      if (option.amount) {
        const countervalue = convertCountervalue(mainAccount.currency, option.amount);
        next[option.id] = formatCountervalueAsFiat(fiatUnit, countervalue, locale);
      }
    }

    // If we have all values, use direct calculation
    if (Object.keys(next).length === feePresetOptions.length) {
      return next;
    }

    return {};
  }, [
    enabled,
    feePresetOptions,
    convertCountervalue,
    mainAccount.currency,
    fiatUnit,
    locale,
    shouldEstimateWithBridge,
  ]);

  const hasDirectValues =
    feePresetOptions.length > 0 &&
    Object.keys(directFiatValues).length === feePresetOptions.length &&
    !shouldEstimateWithBridge;
  const hasAmountForEstimation = useAllAmount || amount.gt(0);

  const canEstimate =
    !hasDirectValues && enabled && recipient && hasAmountForEstimation && presetIds.length > 0;

  if (canEstimate && lastKeyRef.current !== key) {
    lastKeyRef.current = key;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    const bridge = getAccountBridge(account, parentAccount ?? undefined);

    queueMicrotask(() => {
      estimateFiatValuesForPresets({
        bridge,
        mainAccount,
        transaction,
        presetIds,
        convertCountervalue,
        fiatUnit,
        locale,
        requestId,
        requestIdRef,
        setFiatByPreset,
      });
    });
  }

  return hasDirectValues ? directFiatValues : fiatByPreset;
}
