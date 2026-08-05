import { getSendDescriptor } from "../../../bridge/descriptor/registry";
import { resolveFeeUnitLabel } from "../../../bridge/descriptor/send/features";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatFeeRate } from "./gas";

export type FeePresetLegendMap = Readonly<Record<string, string>>;

export function buildFeePresetLegendMap(
  currency: CryptoOrTokenCurrency | undefined,
  feePresetOptions: readonly FeePresetOption[],
): FeePresetLegendMap {
  const descriptor = getSendDescriptor(currency);
  const legendConfig = descriptor?.fees.presets?.legend;

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
