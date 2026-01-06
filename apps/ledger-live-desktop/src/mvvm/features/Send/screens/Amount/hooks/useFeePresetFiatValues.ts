import { useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { FeePresetOption } from "./useFeePresetOptions";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";

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
  enabled: boolean;
  shouldEstimateWithBridge: boolean;
}>;

function buildEstimationKey(params: {
  mainAccountId: string;
  recipient: string;
  amount: BigNumber;
  useAllAmount: boolean;
  family: string;
  feePresetOptions: readonly FeePresetOption[];
  fallbackPresetIds?: readonly string[];
}): string {
  const optionsKey = params.feePresetOptions.map(o => `${o.id}:${o.amount.toString()}`).join("|");
  const fallbackKey = params.fallbackPresetIds?.join("|") ?? "";
  return [
    params.mainAccountId,
    params.recipient,
    params.useAllAmount ? "1" : "0",
    params.amount.toString(),
    params.family,
    optionsKey,
    fallbackKey,
  ].join("::");
}

export function useFeePresetFiatValues({
  account,
  parentAccount,
  mainAccount,
  transaction,
  feePresetOptions,
  fallbackPresetIds,
  counterValueCurrency,
  fiatUnit,
  enabled,
  shouldEstimateWithBridge,
}: Params): FeeFiatMap {
  const convertCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const [fiatByPreset, setFiatByPreset] = useState<FeeFiatMap>({});

  const recipient = transaction.recipient ?? "";
  const amount = useMemo(() => transaction.amount ?? new BigNumber(0), [transaction.amount]);
  const useAllAmount = Boolean(transaction.useAllAmount);
  const presetIdsToEstimate = useMemo(
    () => (feePresetOptions.length > 0 ? feePresetOptions.map(o => o.id) : fallbackPresetIds ?? []),
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
      const countervalue = convertCountervalue(mainAccount.currency, option.amount);
      next[option.id] =
        countervalue !== null && countervalue !== undefined
          ? formatCurrencyUnit(fiatUnit, countervalue, {
              showCode: true,
              disableRounding: true,
            })
          : null;
    }
    return next;
  }, [
    convertCountervalue,
    enabled,
    feePresetOptions,
    fiatUnit,
    mainAccount.currency,
    shouldEstimateWithBridge,
  ]);

  const allowZeroAmountEstimation = transaction.family === "evm";
  const hasAmountForEstimation = allowZeroAmountEstimation ? true : useAllAmount || amount.gt(0);

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

    const bridge = getAccountBridge(account, parentAccount ?? undefined);

    Promise.resolve().then(async () => {
      try {
        const entries = await Promise.all(
          presetIdsToEstimate.map(async presetId => {
            const txWithStrategy = bridge.updateTransaction(transaction, {
              feesStrategy: presetId,
            });
            const preparedTx = await bridge.prepareTransaction(mainAccount, txWithStrategy);
            const status = await bridge.getTransactionStatus(mainAccount, preparedTx);
            const estimatedFees = status.estimatedFees ?? new BigNumber(0);

            const countervalue = convertCountervalue(mainAccount.currency, estimatedFees);
            const fiatValue =
              countervalue !== null && countervalue !== undefined
                ? formatCurrencyUnit(fiatUnit, countervalue, {
                    showCode: true,
                    disableRounding: true,
                  })
                : null;

            return [presetId, fiatValue] as const;
          }),
        );

        if (requestIdRef.current !== requestId) return;

        const next: Record<string, string | null> = {};
        for (const [id, value] of entries) {
          next[id] = value;
        }
        setFiatByPreset(next);
      } finally {
        if (requestIdRef.current === requestId) {
          inFlightRef.current = null;
        }
      }
    });
  }

  return shouldEstimateWithBridge ? fiatByPreset : directFiatValues;
}
