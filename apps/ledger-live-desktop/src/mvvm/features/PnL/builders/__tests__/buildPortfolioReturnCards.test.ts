import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { buildPortfolioReturnCards } from "../buildPortfolioReturnCards";

const fakeT = ((key: string) => key) as unknown as TFunction;

const makeInput = (overrides: Partial<Parameters<typeof buildPortfolioReturnCards>[0]> = {}) => ({
  unrealisedPnL: new BigNumber(60),
  realisedPnL: new BigNumber(40),
  totalPnL: new BigNumber(100),
  formatFiat: (v: BigNumber) => `formatted(${v.toString()})`,
  t: fakeT,
  ...overrides,
});

describe("buildPortfolioReturnCards", () => {
  it("builds the three portfolio return cards in order", () => {
    const cards = buildPortfolioReturnCards(makeInput());

    expect(cards.map(card => card.id)).toEqual([
      "unrealisedReturn",
      "realisedReturn",
      "totalReturn",
    ]);
  });

  it("uses portfolio card title keys", () => {
    const cards = buildPortfolioReturnCards(makeInput());

    expect(cards.map(card => card.title)).toEqual([
      "pnl.portfolio.cards.unrealisedReturn",
      "pnl.portfolio.cards.realisedReturn",
      "pnl.portfolio.cards.totalReturn",
    ]);
  });

  it("formats each card value through the provided fiat formatter", () => {
    const cards = buildPortfolioReturnCards(makeInput());

    expect(cards.map(card => card.value)).toEqual([
      "formatted(60)",
      "formatted(40)",
      "formatted(100)",
    ]);
  });

  it("builds display cards with trend icons", () => {
    const cards = buildPortfolioReturnCards(makeInput());

    expect(cards.every(card => card.type === "display")).toBe(true);
  });
});
