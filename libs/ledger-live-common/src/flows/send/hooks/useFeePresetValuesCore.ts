import { useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import type { Currency } from "@domain/entity-currency";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import { getAccountBridge } from "../../../bridge/impl";
import type { Transaction } from "../../../coin-modules/transaction-types";
import {
  buildEstimationKey,
  buildPresetEstimationPatch,
  getFeesStrategyForPreset,
} from "../utils/feeEstimation";
import { formatFeeCurrencyAmount } from "../utils/networkFeesDisplay";

/** Formatted fee amounts for one preset. Either side is `null` when it cannot be computed. */
export type FeePresetValues = Readonly<{
  fiat: string | null;
  crypto: string | null;
}>;

export type FeePresetValueMap = Readonly<Record<string, FeePresetValues>>;

export type UseFeePresetValuesCoreParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  mainAccount: Account;
  transaction: Transaction;
  feePresetOptions: readonly FeePresetOption[];
  fallbackPresetIds?: readonly string[];
  fiatUnit: Unit;
  /** Unit of the currency the fee is actually paid in, used for the native amount. */
  displayUnit: Unit;
  locale?: string;
  enabled: boolean;
  shouldEstimateWithBridge: boolean;
  allowZeroAmountEstimation: boolean;
  calculateCountervalue: (currency: Currency, value: BigNumber) => BigNumber | null | undefined;
}>;

function formatCountervalueAsFiat(
  fiatUnit: Unit,
  countervalue: BigNumber | null | undefined,
  locale?: string,
): string | null {
  return countervalue !== null && countervalue !== undefined
    ? formatFeeCurrencyAmount(fiatUnit, countervalue, locale)
    : null;
}

async function estimateValuesForPresets(params: {
  bridge: AccountBridge<Transaction>;
  mainAccount: Account;
  transaction: Transaction;
  presetIds: readonly string[];
  calculateCountervalue: (currency: Currency, value: BigNumber) => BigNumber | null | undefined;
  fiatUnit: Unit;
  displayUnit: Unit;
  locale?: string;
  requestId: number;
  requestIdRef: React.RefObject<number>;
  inFlightRef: React.RefObject<string | null>;
  setValuesByPreset: (value: FeePresetValueMap) => void;
}): Promise<void> {
  try {
    const entries = await Promise.all(
      params.presetIds.map(async presetId => {
        const feesStrategy = getFeesStrategyForPreset(presetId);
        const txWithStrategy = params.bridge.updateTransaction(
          params.transaction,
          buildPresetEstimationPatch(feesStrategy),
        );
        const preparedTx = await params.bridge.prepareTransaction(
          params.mainAccount,
          txWithStrategy,
        );
        const status = await params.bridge.getTransactionStatus(params.mainAccount, preparedTx);
        const estimatedFees = status.estimatedFees ?? new BigNumber(0);

        const countervalue = params.calculateCountervalue(
          params.mainAccount.currency,
          estimatedFees,
        );
        const values: FeePresetValues = {
          fiat: formatCountervalueAsFiat(params.fiatUnit, countervalue, params.locale),
          crypto: formatFeeCurrencyAmount(params.displayUnit, estimatedFees, params.locale),
        };

        return [presetId, values] as const;
      }),
    );

    if (params.requestIdRef.current !== params.requestId) return;

    const next: Record<string, FeePresetValues> = {};
    for (const [id, value] of entries) {
      next[id] = value;
    }
    params.setValuesByPreset(next);
  } finally {
    if (params.requestIdRef.current === params.requestId) {
      params.inFlightRef.current = null;
    }
  }
}

export function useFeePresetValuesCore({
  account,
  parentAccount,
  mainAccount,
  transaction,
  feePresetOptions,
  fallbackPresetIds,
  fiatUnit,
  displayUnit,
  locale,
  enabled,
  shouldEstimateWithBridge,
  allowZeroAmountEstimation,
  calculateCountervalue,
}: UseFeePresetValuesCoreParams): FeePresetValueMap {
  const [valuesByPreset, setValuesByPreset] = useState<FeePresetValueMap>({});

  const recipient = transaction.recipient ?? "";
  const amount = useMemo(() => transaction.amount ?? new BigNumber(0), [transaction.amount]);
  const useAllAmount = Boolean(transaction.useAllAmount);
  const presetIdsToEstimate = useMemo(
    () =>
      feePresetOptions.length > 0 ? feePresetOptions.map(o => o.id) : (fallbackPresetIds ?? []),
    [fallbackPresetIds, feePresetOptions],
  );

  const key = useMemo(
    () =>
      buildEstimationKey({
        mainAccountId: mainAccount.id,
        recipient,
        amount,
        useAllAmount,
        family: transaction.family,
        feePresetOptions,
        fallbackPresetIds,
      }),
    [
      amount,
      fallbackPresetIds,
      feePresetOptions,
      mainAccount.id,
      recipient,
      transaction.family,
      useAllAmount,
    ],
  );

  const lastKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const directValues = useMemo<FeePresetValueMap>(() => {
    if (!enabled || shouldEstimateWithBridge || feePresetOptions.length === 0) {
      return {};
    }

    const next: Record<string, FeePresetValues> = {};
    for (const option of feePresetOptions) {
      const countervalue = calculateCountervalue(mainAccount.currency, option.amount);
      next[option.id] = {
        fiat: formatCountervalueAsFiat(fiatUnit, countervalue, locale),
        crypto: formatFeeCurrencyAmount(displayUnit, option.amount, locale),
      };
    }
    return next;
  }, [
    calculateCountervalue,
    displayUnit,
    enabled,
    feePresetOptions,
    fiatUnit,
    locale,
    mainAccount.currency,
    shouldEstimateWithBridge,
  ]);

  const hasAmountForEstimation = allowZeroAmountEstimation || useAllAmount || amount.gt(0);

  const canEstimate =
    shouldEstimateWithBridge &&
    enabled &&
    recipient &&
    hasAmountForEstimation &&
    presetIdsToEstimate.length > 0;

  if (canEstimate && lastKeyRef.current !== key && inFlightRef.current !== key) {
    lastKeyRef.current = key;
    inFlightRef.current = key;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    queueMicrotask(() => {
      void (async () => {
        try {
          const bridge = await getAccountBridge(account, parentAccount ?? undefined);
          await estimateValuesForPresets({
            bridge,
            mainAccount,
            transaction,
            presetIds: presetIdsToEstimate,
            calculateCountervalue,
            fiatUnit,
            displayUnit,
            locale,
            requestId,
            requestIdRef,
            inFlightRef,
            setValuesByPreset,
          });
        } catch {
          if (requestIdRef.current === requestId) {
            lastKeyRef.current = null;
            inFlightRef.current = null;
          }
        }
      })();
    });
  }

  return shouldEstimateWithBridge ? valuesByPreset : directValues;
}
