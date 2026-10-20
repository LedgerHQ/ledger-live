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

  it("should show a held default and keep the missing default at zero", () => {
    const options = build([makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000)]);

    expect(options[0].countervalue).toBe(1000);
    expect(options[1]).toMatchObject({ id: USDC.id, ticker: "USDC", countervalue: 1000 });
    expect(options[2]).toMatchObject({ id: USDT.id, countervalue: 0 });
  });

  it("should list a USDC held on another chain as its own option", () => {
    const options = build([makeItem("polygon/erc20/usd__coin", "USDC", "USD Coin", 500)]);

    expect(options.map(option => option.id)).toEqual([
      "all",
      "polygon/erc20/usd__coin",
      USDC.id,
      USDT.id,
    ]);
    expect(options[1]).toMatchObject({
      id: "polygon/erc20/usd__coin",
      ledgerId: "polygon/erc20/usd__coin",
      countervalue: 500,
      cryptoAmountLabel: "500.00 USDC",
    });
    expect(options[2]).toMatchObject({ id: USDC.id, countervalue: 0 });
  });

  it("should list held stablecoins by countervalue before the zero defaults", () => {
    const options = build([
      makeItem("ethereum/erc20/dai", "DAI", "Dai", 500),
      makeItem("ethereum/erc20/frax", "FRAX", "Frax", 800),
    ]);

    expect(options.map(o => o.ticker)).toEqual([undefined, "FRAX", "DAI", "USDC", "USDT"]);
  });

  it("should keep each USDC asset as its own option", () => {
    const hyperliquid: StablecoinItem = {
      ...makeItem("hyperliquid/usdc", "USDC", "Hyperliquid", 37.7),
      balance: 37_710_700,
    };
    const ethereum: StablecoinItem = {
      ...makeItem(USDC.id, "USDC", "USD Coin", 27.72),
      balance: 27_724_600,
    };
    const arcTestnet: StablecoinItem = {
      currency: {
        id: "arc_testnet",
        name: "Arc Testnet",
        ticker: "USDC",
        units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
      },
      balance: 41_000_000,
      value: 0,
    };

    const options = build([hyperliquid, ethereum, arcTestnet]);

    expect(options[0].countervalue).toBeCloseTo(65.42);
    expect(options.map(option => option.id)).toEqual([
      "all",
      "hyperliquid/usdc",
      USDC.id,
      "arc_testnet",
      USDT.id,
    ]);
    expect(options[1]).toMatchObject({ countervalue: 37.7, cryptoAmountLabel: "37.71 USDC" });
    expect(options[2]).toMatchObject({
      countervalue: 27.72,
      cryptoAmountLabel: "27.72 USDC",
    });
    expect(options[3]).toMatchObject({ countervalue: 0, cryptoAmountLabel: "41.00 USDC" });
  });

  it("should total every held stablecoin in the all option", () => {
    const options = build([
      makeItem("ethereum/erc20/usd__coin", "USDC", "USD Coin", 1000),
      makeItem("ethereum/erc20/dai", "DAI", "Dai", 250),
    ]);

    expect(options[0]).toMatchObject({ id: "all", countervalue: 1250 });
  });
});
