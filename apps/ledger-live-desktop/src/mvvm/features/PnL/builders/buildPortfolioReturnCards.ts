import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import type { PnLCardProps } from "../components/PnLCard/types";
import { buildReturnCard } from "./buildReturnCard";

export type BuildPortfolioReturnCardsInput = {
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  totalPnL: BigNumber;
  formatFiat: (value: BigNumber) => string;
  t: TFunction;
};

export function buildPortfolioReturnCards({
  unrealisedPnL,
  realisedPnL,
  totalPnL,
  formatFiat,
  t,
}: BuildPortfolioReturnCardsInput): PnLCardProps[] {
  const cards: { id: string; value: BigNumber }[] = [
    { id: "unrealisedReturn", value: unrealisedPnL },
    { id: "realisedReturn", value: realisedPnL },
    { id: "totalReturn", value: totalPnL },
  ];

  return cards.map(({ id, value }) =>
    buildReturnCard({ id, titleKey: `pnl.portfolio.cards.${id}`, value, formatFiat, t }),
  );
}
