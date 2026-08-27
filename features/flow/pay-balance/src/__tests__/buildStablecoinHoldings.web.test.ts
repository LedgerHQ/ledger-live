import {
  buildStablecoinHoldings,
  type BuildStablecoinHoldingsParams,
  type HeldAccount,
} from "../logic/buildStablecoinHoldings";
import type { StablecoinItem } from "../logic/buildBalanceFilterOptions";

const USDC_CURRENCY: StablecoinItem["currency"] = {
  id: "ethereum/erc20/usd__coin",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

const USDT_CURRENCY: StablecoinItem["currency"] = {
  id: "ethereum/erc20/usd_tether__erc20_",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};

const ETH_CURRENCY: StablecoinItem["currency"] = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  units: [{ name: "Ether", code: "ETH", magnitude: 18 }],
};

const UNI_CURRENCY: StablecoinItem["currency"] = {
  id: "ethereum/erc20/uniswap",
  name: "Uniswap",
  ticker: "UNI",
  units: [{ name: "Uniswap", code: "UNI", magnitude: 18 }],
};

const usdcCatalog: StablecoinItem = {
  currency: USDC_CURRENCY,
  balance: 1_000_000_000,
  value: 1000,
};
const usdtCatalog: StablecoinItem = { currency: USDT_CURRENCY, balance: 250_000_000, value: 250 };

const usdcHeld: HeldAccount = {
  type: "TokenAccount",
  balance: 1_000_000,
  currency: USDC_CURRENCY,
};

const ethHeld: HeldAccount = {
  type: "Account",
  balance: 1_000_000_000_000_000_000,
  currency: ETH_CURRENCY,
};

const uniHeld: HeldAccount = {
  type: "TokenAccount",
  balance: 1_000_000,
  currency: UNI_CURRENCY,
};

function build(overrides: Partial<BuildStablecoinHoldingsParams> = {}) {
  return buildStablecoinHoldings({
    catalog: [],
    heldAccounts: [],
    blacklistedTokenIds: [],
    stablecoinTickers: new Set(),
    isLoadingStablecoinTickers: false,
    ...overrides,
  });
}

describe("buildStablecoinHoldings", () => {
  it("should return catalog rows when DADA has classified holdings", () => {
    expect(
      build({
        catalog: [usdcCatalog],
        heldAccounts: [usdcHeld],
        stablecoinTickers: new Set(["USDC"]),
      }),
    ).toEqual([usdcCatalog]);
  });

  it("should treat a held token as a stablecoin while tickers are still loading", () => {
    expect(build({ heldAccounts: [usdcHeld], isLoadingStablecoinTickers: true })).toEqual([
      { currency: USDC_CURRENCY, balance: 1_000_000, value: 0 },
    ]);
  });

  it("should ignore a native account while tickers are still loading", () => {
    expect(build({ heldAccounts: [ethHeld], isLoadingStablecoinTickers: true })).toEqual([]);
  });

  it("should keep a held account whose ticker is in the catalog", () => {
    expect(build({ heldAccounts: [usdcHeld], stablecoinTickers: new Set(["USDC"]) })).toEqual([
      { currency: USDC_CURRENCY, balance: 1_000_000, value: 0 },
    ]);
  });

  it("should omit a held token whose ticker is not a stablecoin", () => {
    expect(build({ heldAccounts: [uniHeld], stablecoinTickers: new Set(["USDC"]) })).toEqual([]);
  });

  it("should omit blacklisted catalog rows", () => {
    expect(
      build({
        catalog: [usdcCatalog, usdtCatalog],
        blacklistedTokenIds: [USDC_CURRENCY.id],
      }),
    ).toEqual([usdtCatalog]);
  });

  it("should omit catalog rows with no positive amount", () => {
    expect(
      build({
        catalog: [{ currency: USDC_CURRENCY, balance: 0, value: 0 }, usdtCatalog],
      }),
    ).toEqual([usdtCatalog]);
  });

  it("should fall back to held accounts when the catalog only has zero amounts", () => {
    expect(
      build({
        catalog: [{ currency: USDC_CURRENCY, balance: 0, value: 0 }],
        heldAccounts: [usdcHeld],
        stablecoinTickers: new Set(["USDC"]),
      }),
    ).toEqual([{ currency: USDC_CURRENCY, balance: 1_000_000, value: 0 }]);
  });
});
