import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { pnlPercentage } from "@ledgerhq/wallet-pnl";
import type { PnlDetailItem } from "../components/PnlDetail/types";
import type { PnlNamespace } from "../types";

export type BuildPnlDetailInput = {
  namespace: PnlNamespace;
  totalPnL: BigNumber;
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  costBasis: BigNumber;
  lifetimeCost: BigNumber;
  formatFiat: (value: BigNumber, alwaysShowSign?: boolean) => string;
  t: TFunction;
};

export type PnlDetailData = {
  title: string;
  description: string;
  items: PnlDetailItem[];
  disclaimer: string;
};

function toPercentValue(pnl: BigNumber, basis: BigNumber): number | undefined {
  return pnlPercentage(pnl, basis)?.toNumber();
}

export function buildPnlDetail({
  namespace,
  totalPnL,
  unrealisedPnL,
  realisedPnL,
  costBasis,
  lifetimeCost,
  formatFiat,
  t,
}: BuildPnlDetailInput): PnlDetailData {
  const key = (suffix: string) => `${namespace}.dialog.${suffix}`;
  const realisedCostBasis = lifetimeCost.minus(costBasis);

  return {
    title: t(key("title")),
    description: t(key("description")),
    disclaimer: t("pnl.disclaimer"),
    items: [
      {
        title: t(key("unrealisedReturn.title")),
        description: t(key("unrealisedReturn.description")),
        value: formatFiat(unrealisedPnL, true),
        percentage: toPercentValue(unrealisedPnL, costBasis),
      },
      {
        title: t(key("realisedReturn.title")),
        description: t(key("realisedReturn.description")),
        value: formatFiat(realisedPnL, true),
        percentage: toPercentValue(realisedPnL, realisedCostBasis),
      },
      {
        title: t(key("totalReturn.title")),
        description: t(key("totalReturn.description")),
        value: formatFiat(totalPnL, true),
        percentage: toPercentValue(totalPnL, lifetimeCost),
      },
    ],
  };
}
