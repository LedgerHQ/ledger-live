import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "../components/PnLCard/types";
import type { PnlSecondaryCardConfig } from "../types";

export type BuildInfoCardInput = PnlSecondaryCardConfig & {
  formatFiat: (value: BigNumber) => string;
  t: TFunction;
};

export function buildInfoCard({
  id,
  titleKey,
  tooltipKey,
  value,
  formatFiat,
  t,
}: BuildInfoCardInput): PnLCardProps {
  return {
    id,
    title: t(titleKey),
    value: formatFiat(value),
    type: "info",
    tooltipContent: t(tooltipKey),
  };
}
