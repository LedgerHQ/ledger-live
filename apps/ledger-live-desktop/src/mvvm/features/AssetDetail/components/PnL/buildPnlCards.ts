import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "LLD/features/PnL/components/PnLCard/types";
import type { PnlCardId } from "./types";

export type BuildPnlCardsInput = {
  unrealisedPnL: BigNumber;
  averageEntryPrice: BigNumber;
  formatFiat: (value: BigNumber) => string;
  onUnrealisedReturnClick: () => void;
  t: TFunction;
};

const UNREALISED_RETURN_ID: PnlCardId = "unrealisedReturn";
const AVERAGE_ENTRY_PRICE_ID: PnlCardId = "averageEntryPrice";

export function buildPnlCards({
  unrealisedPnL,
  averageEntryPrice,
  formatFiat,
  onUnrealisedReturnClick,
  t,
}: BuildPnlCardsInput): PnLCardProps[] {
  return [
    {
      id: UNREALISED_RETURN_ID,
      title: t("pnl.asset.return.title"),
      value: formatFiat(unrealisedPnL),
      type: "interactive",
      trend: unrealisedPnL.isNegative() ? "down" : "up",
      onClick: onUnrealisedReturnClick,
    },
    {
      id: AVERAGE_ENTRY_PRICE_ID,
      title: t("pnl.asset.entry.title"),
      value: formatFiat(averageEntryPrice),
      type: "info",
      tooltipContent: t("pnl.asset.entry.tooltip"),
    },
  ];
}
