import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "../components/PnLCard/types";
import type { PnlNamespace } from "../types";

export type BuildUnrealisedReturnCardInput = {
  namespace: PnlNamespace;
  unrealisedPnL: BigNumber;
  formatFiat: (value: BigNumber) => string;
  onClick: () => void;
  t: TFunction;
};

export function buildUnrealisedReturnCard({
  namespace,
  unrealisedPnL,
  formatFiat,
  onClick,
  t,
}: BuildUnrealisedReturnCardInput): PnLCardProps {
  return {
    id: "unrealisedReturn",
    title: t(`${namespace}.return.title`),
    value: formatFiat(unrealisedPnL),
    type: "interactive",
    trend: unrealisedPnL.isNegative() ? "down" : "up",
    onClick,
  };
}
