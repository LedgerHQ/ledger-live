import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { buildPnlDetail } from "../buildPnlDetail";

const fakeT = ((key: string) => key) as unknown as TFunction;

const makeInput = (overrides: Partial<Parameters<typeof buildPnlDetail>[0]> = {}) => ({
  namespace: "pnl.asset" as const,
  totalPnL: new BigNumber(100),
  unrealisedPnL: new BigNumber(60),
  realisedPnL: new BigNumber(40),
  costBasis: new BigNumber(2000),
  lifetimeCost: new BigNumber(3000),
  formatFiat: (v: BigNumber, alwaysShowSign?: boolean) =>
    `formatted(${v.toString()}${alwaysShowSign ? ",sign" : ""})`,
  t: fakeT,
  ...overrides,
});

describe("buildPnlDetail", () => {
  it("uses the asset namespace for translation keys", () => {
    const detail = buildPnlDetail(makeInput({ namespace: "pnl.asset" }));

    expect(detail.title).toBe("pnl.asset.drawer.title");
    expect(detail.items.map(i => i.title)).toEqual([
      "pnl.asset.drawer.estimatedReturn.title",
      "pnl.asset.drawer.realisedReturn.title",
      "pnl.asset.drawer.totalReturn.title",
    ]);
  });

  it("uses the portfolio namespace for translation keys", () => {
    const detail = buildPnlDetail(makeInput({ namespace: "pnl.portfolio" }));

    expect(detail.title).toBe("pnl.portfolio.drawer.title");
    expect(detail.items.map(i => i.title)).toEqual([
      "pnl.portfolio.drawer.estimatedReturn.title",
      "pnl.portfolio.drawer.realisedReturn.title",
      "pnl.portfolio.drawer.totalReturn.title",
    ]);
  });

  it("formats each PnL bucket through the provided fiat formatter, always showing the sign", () => {
    const detail = buildPnlDetail(makeInput());

    expect(detail.items.map(i => i.value)).toEqual([
      "formatted(60,sign)",
      "formatted(40,sign)",
      "formatted(100,sign)",
    ]);
  });

  it("computes percentage evolution for each bucket against the appropriate cost basis", () => {
    const detail = buildPnlDetail(makeInput());
    const percentages = detail.items.map(i => i.percentage);

    expect(percentages[0]).toBe(3);
    expect(percentages[1]).toBe(4);
    expect(percentages[2]).toBeCloseTo(3.33, 2);
  });

  it("omits percentage when the relevant cost basis is zero", () => {
    const detail = buildPnlDetail(
      makeInput({ costBasis: new BigNumber(0), lifetimeCost: new BigNumber(0) }),
    );

    expect(detail.items.map(i => i.percentage)).toEqual([undefined, undefined, undefined]);
  });

  it("omits realised percentage when costBasis exceeds lifetimeCost", () => {
    const detail = buildPnlDetail(
      makeInput({ costBasis: new BigNumber(3000), lifetimeCost: new BigNumber(2000) }),
    );

    expect(detail.items[0].percentage).toBe(2);
    expect(detail.items[1].percentage).toBeUndefined();
    expect(detail.items[2].percentage).toBeCloseTo(5, 2);
  });
});
