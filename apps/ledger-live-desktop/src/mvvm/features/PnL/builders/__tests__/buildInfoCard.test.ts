import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { buildInfoCard } from "../buildInfoCard";

const fakeT = ((key: string) => key) as unknown as TFunction;

describe("buildInfoCard", () => {
  it("returns an info card with translated title/tooltip and formatted value", () => {
    const card = buildInfoCard({
      id: "costBasis",
      titleKey: "pnl.portfolio.costBasis.title",
      tooltipKey: "pnl.portfolio.costBasis.tooltip",
      value: new BigNumber(42),
      formatFiat: (v: BigNumber) => `formatted(${v.toString()})`,
      t: fakeT,
    });

    expect(card).toEqual({
      id: "costBasis",
      title: "pnl.portfolio.costBasis.title",
      value: "formatted(42)",
      type: "info",
      tooltipContent: "pnl.portfolio.costBasis.tooltip",
    });
  });
});
