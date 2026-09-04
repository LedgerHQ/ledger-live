import type { Unit } from "@domain/entity-currency-unit";
import {
  buildBalanceFilterOptions,
  type DefaultStablecoin,
  type StablecoinItem,
} from "../logic/buildBalanceFilterOptions";

const USDC: DefaultStablecoin = {
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  name: "USD Coin",
  magnitude: 6,
};

const USDT: DefaultStablecoin = {
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  name: "Tether USD",
  magnitude: 6,
};

function makeItem(id: string, ticker: string, name: string, value: number): StablecoinItem {
  return {
    currency: { id, name, ticker, units: [{ name, code: ticker, magnitude: 6 }] },
    balance: value * 1_000_000,
    value,
  };
}

const formatFiat = (value: number): string => `$${value.toFixed(2)}`;
const formatCrypto = (unit: Unit, balance: number): string =>
  `${(balance / 10 ** unit.magnitude).toFixed(2)} ${unit.code}`;

function build(stablecoins: StablecoinItem[], defaults: DefaultStablecoin[] = [USDC, USDT]) {
  return buildBalanceFilterOptions({
    stablecoins,
    defaultStablecoins: defaults,
    allLabel: "All stablecoins",
    formatFiat,
    formatCrypto,
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
