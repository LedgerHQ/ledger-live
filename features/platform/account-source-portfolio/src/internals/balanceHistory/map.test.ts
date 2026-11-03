import { CountervalueTickerSchema } from "@domain/entity-account-balance";
import { ETH, point } from "../fakeService.mock";
import { fiatOf } from "../fiat";
import { toAssetHistories } from "./map";

const USDC = "ethereum/erc20/usd__coin";

describe("toAssetHistories", () => {
  it("groups points per asset, native coin first, each oldest point first", () => {
    const mapped = toAssetHistories(ETH, [
      point(ETH, { asset: "0xusdc", cal_id: USDC, time: "2026-10-02T00:00:00Z", value: "7" }),
      point(ETH, { time: "2026-10-02T00:00:00Z", value: "12" }),
      point(ETH, { time: "2026-10-01T00:00:00+02:00", value: "10" }),
    ]);

    expect(mapped).toEqual({
      series: [
        {
          assetId: "ethereum",
          points: [
            { date: "2026-09-30T22:00:00.000Z", balance: "10" },
            { date: "2026-10-02T00:00:00.000Z", balance: "12" },
          ],
        },
        { assetId: USDC, points: [{ date: "2026-10-02T00:00:00.000Z", balance: "7" }] },
      ],
      unmapped: 0,
      unreadable: 0,
    });
  });

  it("leaves out tokens without a CAL id and counts assets with an unreadable point", () => {
    const mapped = toAssetHistories(ETH, [
      point(ETH, { asset: "0xunknown", cal_id: null }),
      point(ETH, { asset: "0xusdc", cal_id: USDC, value: "1.5" }),
      point(ETH, { time: "not a date" }),
    ]);

    expect(mapped).toEqual({ series: [], unmapped: 1, unreadable: 2 });
  });

  it("values each point from its currency_value in the fiat's smallest unit, half up", () => {
    const fiat = fiatOf({ countervalue: CountervalueTickerSchema.parse("EUR") });
    const mapped = toAssetHistories(
      ETH,
      [
        point(ETH, { time: "2026-10-01T00:00:00Z", value: "10", currency_value: 12.345 }),
        point(ETH, { time: "2026-10-02T00:00:00Z", value: "12", currency_value: null }),
      ],
      fiat,
    );
    expect(mapped.series[0].points).toEqual([
      { date: "2026-10-01T00:00:00.000Z", balance: "10", countervalues: { EUR: "1235" } },
      { date: "2026-10-02T00:00:00.000Z", balance: "12" },
    ]);
  });

  it("leaves the currency_value out when the read asked for no fiat", () => {
    const mapped = toAssetHistories(ETH, [point(ETH, { currency_value: 3 })]);
    expect(mapped.series[0].points[0]).not.toHaveProperty("countervalues");
  });
});
