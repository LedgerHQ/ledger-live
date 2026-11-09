import { resolveFeeUnitLabel, type SendFeatures } from "../descriptor/features";
import type { FeePresetOption } from "../descriptor/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatFeeRate } from "./gas";

export type FeePresetLegendMap = Readonly<Record<string, string>>;

export function buildFeePresetLegendMap(
  sendFeatures: SendFeatures,
  currency: CryptoOrTokenCurrency | undefined,
  feePresetOptions: readonly FeePresetOption[],
): FeePresetLegendMap {
  const legendConfig = sendFeatures.getFeePresetLegend(currency);

  if (!legendConfig || legendConfig.type === "none") return {};
  if (legendConfig.type !== "feeRate" || legendConfig.valueFrom !== "presetAmount") return {};

  const unit = resolveFeeUnitLabel(legendConfig.unit, currency)?.trim();
  if (!unit) return {};

  const next: Record<string, string> = {};
  for (const option of feePresetOptions) {
    const rate = formatFeeRate(option.amount);
    if (!rate) continue;
    next[option.id] = `${rate} ${unit}`;
  }
  return next;
}
