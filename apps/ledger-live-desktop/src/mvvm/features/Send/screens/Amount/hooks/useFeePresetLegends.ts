import { useMemo } from "react";
import { getSendDescriptor } from "@ledgerhq/live-common/bridge/descriptor";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FeePresetOption } from "./useFeePresetOptions";

export type FeePresetLegendMap = Readonly<Record<string, string>>;

function formatFeeRate(amount: FeePresetOption["amount"]): string {
  if (!amount || !amount.isFinite() || amount.isNaN()) return "";
  return amount.integerValue().toFixed(0);
}

type Params = Readonly<{
  currency: CryptoOrTokenCurrency | undefined;
  feePresetOptions: readonly FeePresetOption[];
}>;

export function useFeePresetLegends({ currency, feePresetOptions }: Params): FeePresetLegendMap {
  return useMemo(() => {
    const descriptor = getSendDescriptor(currency);
    const legendConfig = descriptor?.fees.presets?.legend;

    if (!legendConfig || legendConfig.type === "none") return {};
    if (legendConfig.type !== "feeRate" || legendConfig.valueFrom !== "presetAmount") return {};

    const unit = legendConfig.unit?.trim();
    if (!unit) return {};

    const next: Record<string, string> = {};
    for (const option of feePresetOptions) {
      const rate = formatFeeRate(option.amount);
      if (!rate) continue;
      next[option.id] = `${rate} ${unit}`;
    }
    return next;
  }, [currency, feePresetOptions]);
}
