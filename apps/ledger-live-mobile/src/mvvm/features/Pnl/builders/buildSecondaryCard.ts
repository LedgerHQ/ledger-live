import type { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnlCardViewModel, PnlSecondaryCardConfig } from "../types";

export type BuildSecondaryCardInput = PnlSecondaryCardConfig & {
  formatFiat: (value: BigNumber) => string;
  onPress: () => void;
  t: TFunction;
};

export function buildSecondaryCard({
  titleKey,
  value,
  formatFiat,
  onPress,
  t,
}: BuildSecondaryCardInput): PnlCardViewModel {
  return {
    title: t(titleKey),
    value: formatFiat(value),
    onPress,
  };
}
