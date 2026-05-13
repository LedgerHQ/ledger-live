import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { buildPnlDetail } from "../buildPnlDetail";

const fakeT = ((key: string) => key) as unknown as TFunction;

const makeInput = (overrides: Partial<Parameters<typeof buildPnlDetail>[0]> = {}) => ({
  assetName: "Bitcoin",
  totalPnL: new BigNumber(100),
  unrealisedPnL: new BigNumber(60),
  realisedPnL: new BigNumber(40),
  formatFiat: (v: BigNumber) => `formatted(${v.toString()})`,
  t: fakeT,
  ...overrides,
});

describe("buildPnlDetail", () => {
  it("returns dialog title, description, and items in [unrealised, realised, total] order", () => {
    const detail = buildPnlDetail(makeInput());

    expect(detail.title).toBe("pnl.asset.dialog.title");
    expect(detail.description).toBe("pnl.asset.dialog.description");
    expect(detail.items.map(i => i.title)).toEqual([
      "pnl.asset.dialog.unrealisedReturn.title",
      "pnl.asset.dialog.realisedReturn.title",
      "pnl.asset.dialog.totalReturn.title",
    ]);
  });

  it("formats each PnL bucket through the provided fiat formatter", () => {
    const detail = buildPnlDetail(makeInput());

    expect(detail.items.map(i => i.value)).toEqual([
      "formatted(60)",
      "formatted(40)",
      "formatted(100)",
    ]);
  });
});
