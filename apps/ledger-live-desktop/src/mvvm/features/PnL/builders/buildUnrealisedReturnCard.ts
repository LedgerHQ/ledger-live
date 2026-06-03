import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "../components/PnLCard/types";
import type { PnlNamespace } from "../types";
import { buildReturnCard } from "./buildReturnCard";

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
  return buildReturnCard({
    id: "unrealisedReturn",
    titleKey: `${namespace}.return.title`,
    value: unrealisedPnL,
    formatFiat,
    t,
    onClick,
  });
}
