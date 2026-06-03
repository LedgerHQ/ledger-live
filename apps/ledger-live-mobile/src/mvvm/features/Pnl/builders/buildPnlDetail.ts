import type { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnlDetailItem } from "../components/PnlDetailDrawer/types";
import type { PnlNamespace } from "../types";

export type BuildPnlDetailInput = {
  namespace: PnlNamespace;
  totalPnL: BigNumber;
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  formatFiat: (value: BigNumber, alwaysShowSign?: boolean) => string;
  t: TFunction;
};

export type PnlDetailData = {
  title: string;
  description: string;
  items: PnlDetailItem[];
};

export function buildPnlDetail({
  namespace,
  totalPnL,
  unrealisedPnL,
  realisedPnL,
  formatFiat,
  t,
}: BuildPnlDetailInput): PnlDetailData {
  const key = (suffix: string) => `${namespace}.drawer.${suffix}`;
  return {
    title: t(key("title")),
    description: t(key("description")),
    items: [
      {
        title: t(key("estimatedReturn.title")),
        definition: t(key("estimatedReturn.description")),
        value: formatFiat(unrealisedPnL, true),
      },
      {
        title: t(key("realisedReturn.title")),
        definition: t(key("realisedReturn.description")),
        value: formatFiat(realisedPnL, true),
      },
      {
        title: t(key("totalReturn.title")),
        definition: t(key("totalReturn.description")),
        value: formatFiat(totalPnL, true),
      },
    ],
  };
}
