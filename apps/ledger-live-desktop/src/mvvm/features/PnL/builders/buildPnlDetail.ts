import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnlDetailItem } from "../components/PnlDetail";
import type { PnlNamespace } from "../types";

export type BuildPnlDetailInput = {
  namespace: PnlNamespace;
  totalPnL: BigNumber;
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  formatFiat: (value: BigNumber) => string;
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
  const key = (suffix: string) => `${namespace}.dialog.${suffix}`;
  return {
    title: t(key("title")),
    description: t(key("description")),
    items: [
      {
        title: t(key("unrealisedReturn.title")),
        description: t(key("unrealisedReturn.description")),
        value: formatFiat(unrealisedPnL),
      },
      {
        title: t(key("realisedReturn.title")),
        description: t(key("realisedReturn.description")),
        value: formatFiat(realisedPnL),
      },
      {
        title: t(key("totalReturn.title")),
        description: t(key("totalReturn.description")),
        value: formatFiat(totalPnL),
      },
    ],
  };
}
