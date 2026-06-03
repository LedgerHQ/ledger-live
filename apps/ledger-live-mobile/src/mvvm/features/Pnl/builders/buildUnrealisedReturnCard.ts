import type { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { trendFromSign } from "@ledgerhq/wallet-pnl";
import type { PnlCardViewModel, PnlNamespace, PnlTrend } from "../types";

export type BuildUnrealisedReturnCardInput = {
  namespace: PnlNamespace;
  unrealisedPnL: BigNumber;
  formatFiat: (value: BigNumber) => string;
  onPress: () => void;
  t: TFunction;
};

export type UnrealisedReturnCard = PnlCardViewModel & { trend: PnlTrend };

export function buildUnrealisedReturnCard({
  namespace,
  unrealisedPnL,
  formatFiat,
  onPress,
  t,
}: BuildUnrealisedReturnCardInput): UnrealisedReturnCard {
  return {
    title: t(`${namespace}.return.title`),
    value: formatFiat(unrealisedPnL),
    trend: trendFromSign(unrealisedPnL),
    onPress,
  };
}
