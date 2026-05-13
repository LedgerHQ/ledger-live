import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnlDetailItem } from "LLD/features/PnL/components/PnlDetail";

export type BuildPnlDetailInput = {
  assetName: string;
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
  assetName,
  totalPnL,
  unrealisedPnL,
  realisedPnL,
  formatFiat,
  t,
}: BuildPnlDetailInput): PnlDetailData {
  return {
    title: t("pnl.asset.dialog.title", { asset: assetName }),
    description: t("pnl.asset.dialog.description"),
    items: [
      {
        title: t("pnl.asset.dialog.unrealisedReturn.title"),
        description: t("pnl.asset.dialog.unrealisedReturn.description"),
        value: formatFiat(unrealisedPnL),
      },
      {
        title: t("pnl.asset.dialog.realisedReturn.title"),
        description: t("pnl.asset.dialog.realisedReturn.description"),
        value: formatFiat(realisedPnL),
      },
      {
        title: t("pnl.asset.dialog.totalReturn.title"),
        description: t("pnl.asset.dialog.totalReturn.description"),
        value: formatFiat(totalPnL),
      },
    ],
  };
}
