import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnlDetailItem } from "../components/PnlDetail";
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
  disclaimer: string;
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
    disclaimer: t("pnl.disclaimer"),
    items: [
      {
        title: t(key("unrealisedReturn.title")),
        description: t(key("unrealisedReturn.description")),
        value: formatFiat(unrealisedPnL, true),
      },
      {
        title: t(key("realisedReturn.title")),
        description: t(key("realisedReturn.description")),
        value: formatFiat(realisedPnL, true),
      },
      {
        title: t(key("totalReturn.title")),
        description: t(key("totalReturn.description")),
        value: formatFiat(totalPnL, true),
      },
    ],
  };
}
