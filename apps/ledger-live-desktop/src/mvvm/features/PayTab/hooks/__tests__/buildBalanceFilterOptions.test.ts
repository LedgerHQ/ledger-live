import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { buildBalanceFilterOptions } from "../buildBalanceFilterOptions";
import type { DefaultStablecoin } from "../usePayStablecoins";
import { USDC, USDT, USD_UNIT, makeItem } from "./fixtures";

function build(stablecoins: CategorizedAssetItem[], defaults: DefaultStablecoin[] = [USDC, USDT]) {
  return buildBalanceFilterOptions({
    stablecoins,
    defaultStablecoins: defaults,
    allLabel: "All stablecoins",
    locale: "en",
    counterValueUnit: USD_UNIT,
  });
}

describe("buildBalanceFilterOptions", () => {
  it("should always offer USDC and USDT at zero when nothing is held", () => {
    const options = build([]);

    expect(options.map(o => o.id)).toEqual(["all", USDC.id, USDT.id]);
    expect(options[0]).toMatchObject({ id: "all", title: "All stablecoins", countervalue: 0 });
    expect(options[1]).toMatchObject({
      id: USDC.id,
      ticker: "USDC",
      ledgerId: USDC.id,
      countervalue: 0,
    });
    expect(options[1].cryptoAmountLabel).toContain("USDC");
    expect(options[2]).toMatchObject({ id: USDT.id, ticker: "USDT", countervalue: 0 });
  });

  it("should merge held balances into the default rows", () => {
    const options = build([makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000)]);

    expect(options[0].countervalue).toBe(1000);
    expect(options[1]).toMatchObject({ id: USDC.id, ticker: "USDC", countervalue: 1000 });
    expect(options[2].countervalue).toBe(0);
  });

  it("should keep the canonical default id even when USDC is held on another chain", () => {
    const options = build([makeItem("polygon/erc20/usd__coin", "USDC", "USD Coin", 500)]);

    expect(options[1]).toMatchObject({ id: USDC.id, ledgerId: USDC.id, countervalue: 500 });
  });

  it("should list other held stablecoins after the defaults, ordered by countervalue", () => {
    const options = build([
      makeItem("ethereum/erc20/dai", "DAI", "Dai", 500),
      makeItem("ethereum/erc20/frax", "FRAX", "Frax", 800),
    ]);

    expect(options.map(o => o.ticker)).toEqual([undefined, "USDC", "USDT", "FRAX", "DAI"]);
  });

  it("should total every held stablecoin in the all option", () => {
    const options = build([
      makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000),
      makeItem("ethereum/erc20/dai", "DAI", "Dai", 250),
    ]);

    expect(options[0]).toMatchObject({ id: "all", countervalue: 1250 });
  });
});
