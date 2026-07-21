import { useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@domain/entity-currency";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import { getAccountBridge } from "../../../bridge/impl";
import type { Transaction } from "../../../coin-modules/transaction-types";
import {
  buildEstimationKey,
  buildPresetEstimationPatch,
  getFeesStrategyForPreset,
} from "../utils/feeEstimation";

export type FeeFiatMap = Readonly<Record<string, string | null>>;

export type UseFeePresetFiatValuesCoreParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  mainAccount: Account;
  transaction: Transaction;
  feePresetOptions: readonly FeePresetOption[];
  fallbackPresetIds?: readonly string[];
  fiatUnit: Unit;
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
    ? formatCurrencyUnit(fiatUnit, countervalue, {
        showCode: true,
        disableRounding: true,
        ...(locale ? { locale } : {}),
      })
    : null;
}

async function estimateFiatValuesForPresets(params: {
  bridge: AccountBridge<Transaction>;
  mainAccount: Account;
  transaction: Transaction;
  presetIds: readonly string[];
  calculateCountervalue: (currency: Currency, value: BigNumber) => BigNumber | null | undefined;
  fiatUnit: Unit;
  locale?: string;
  requestId: number;
  requestIdRef: React.RefObject<number>;
  inFlightRef: React.RefObject<string | null>;
  setFiatByPreset: (value: FeeFiatMap) => void;
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
          params.mainAccount.currency as unknown as Currency,
          estimatedFees,
        );
        const fiatValue = formatCountervalueAsFiat(params.fiatUnit, countervalue, params.locale);

        return [presetId, fiatValue] as const;
      }),
    );

    if (params.requestIdRef.current !== params.requestId) return;

    const next: Record<string, string | null> = {};
    for (const [id, value] of entries) {
      next[id] = value;
    }
    params.setFiatByPreset(next);
  } finally {
    if (params.requestIdRef.current === params.requestId) {
      params.inFlightRef.current = null;
    }
  }
}

export function useFeePresetFiatValuesCore({
  account,
  parentAccount,
  mainAccount,
  transaction,
  feePresetOptions,
  fallbackPresetIds,
  fiatUnit,
  locale,
  enabled,
  shouldEstimateWithBridge,
  allowZeroAmountEstimation,
  calculateCountervalue,
}: UseFeePresetFiatValuesCoreParams): FeeFiatMap {
  const [fiatByPreset, setFiatByPreset] = useState<FeeFiatMap>({});

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

  const directFiatValues = useMemo<FeeFiatMap>(() => {
    if (!enabled || shouldEstimateWithBridge || feePresetOptions.length === 0) {
      return {};
    }

    const next: Record<string, string | null> = {};
    for (const option of feePresetOptions) {
      const countervalue = calculateCountervalue(
        mainAccount.currency as unknown as Currency,
        option.amount,
      );
      next[option.id] = formatCountervalueAsFiat(fiatUnit, countervalue, locale);
    }
    return next;
  }, [
    calculateCountervalue,
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
          await estimateFiatValuesForPresets({
            bridge,
            mainAccount,
            transaction,
            presetIds: presetIdsToEstimate,
            calculateCountervalue,
            fiatUnit,
            locale,
            requestId,
            requestIdRef,
            inFlightRef,
            setFiatByPreset,
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

  return shouldEstimateWithBridge ? fiatByPreset : directFiatValues;
}
