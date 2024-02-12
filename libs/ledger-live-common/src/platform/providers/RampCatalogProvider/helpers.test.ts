/** curl -X 'GET' \
  'https://swap.ledger.com/buy/v1/provider/currencies?currency=crypto' \
  -H 'accept: application/json' */

import { getCryptoCurrencyIds, getRampServiceProviders, isCurrencyInCatalog } from "./helpers";
import { CurrenciesPerProvider } from "./types";

const apiData = {
  onRamp: {
    transak: ["near", "algorand", "avalanche", "tron"],
    coinify: [
      "ethereum",
      "bitcoin",
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/shiba_inu",
      "polygon",
      "polygon/erc20/usd_coin_(pos)",
      "ethereum/erc20/ankr_network",
      "ethereum/erc20/decentraland_mana",
    ],
    moonpay: ["ethereum/erc20/aave", "cosmos", "stellar", "ripple"],
    mercuryo: ["ripple", "kusama", "near", "polygon", "solana", "stellar", "tron"],
    btcdirect: ["ethereum", "bitcoin", "solana", "stellar", "litecoin", "ripple"],
    paypal: ["bitcoin", "ethereum", "litecoin", "bitcoin_cash"],
    banxa: [
      "ethereum_classic",
      "ethereum/erc20/omg",
      "ethereum/erc20/sushi",
      "ethereum/erc20/uniswap",
    ],
    sardine: ["solana"],
    juno: ["bitcoin", "ethereum"],
    simplex: ["ethereum/erc20/vndc", "ethereum/erc20/wrapped_bitcoin", "ethereum/erc20/xy_oracle"],
    loopipay: ["bitcoin", "avalanche", "bsc"],
    ramp: ["bsc", "bsc/bep20/fevrtoken"],
  },
  offRamp: { coinify: ["bitcoin"] },
};

describe("RampCatalogProvider > getCryptoCurrencyIds()", () => {
  it("getCryptoCurrencyIds() should return all buyable crypto currency IDs as a single array", () => {
    const result = getCryptoCurrencyIds(apiData.onRamp);

    expect(result).toEqual([
      "near",
      "algorand",
      "avalanche",
      "tron",
      "ethereum",
      "bitcoin",
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/shiba_inu",
      "polygon",
      "polygon/erc20/usd_coin_(pos)",
      "ethereum/erc20/ankr_network",
      "ethereum/erc20/decentraland_mana",
      "ethereum/erc20/aave",
      "cosmos",
      "stellar",
      "ripple",
      "kusama",
      "solana",
      "litecoin",
      "bitcoin_cash",
      "ethereum_classic",
      "ethereum/erc20/omg",
      "ethereum/erc20/sushi",
      "ethereum/erc20/uniswap",
      "ethereum/erc20/vndc",
      "ethereum/erc20/wrapped_bitcoin",
      "ethereum/erc20/xy_oracle",
      "bsc",
      "bsc/bep20/fevrtoken",
    ]);
  });

  it("returns null if no data", () => {
    const result = getCryptoCurrencyIds(null as unknown as CurrenciesPerProvider);

    expect(result).toEqual(null);
  });

  it("returns null if no data", () => {
    const result = getCryptoCurrencyIds({});

    expect(result).toEqual(null);
  });
});

describe("RampCatalogProvider > getRampStatusForCurrency()", () => {
  it("should return true for a currency that is supported by at least one provider", () => {
    const result = isCurrencyInCatalog("ethereum", apiData, "onRamp");
    expect(result).toEqual(true);
  });

  it("should return false for an offRamp currency search that is only supported by onRamp providers", () => {
    const result = isCurrencyInCatalog("ethereum", apiData, "offRamp");
    expect(result).toEqual(false);
  });

  it("should return false for a currency that is not supported by at least one provider", () => {
    const result = isCurrencyInCatalog("madeup/coin", apiData, "onRamp");
    expect(result).toEqual(false);
  });
});

describe("RampCatalogProvider > getRampServiceProviders()", () => {
  it("should return an array of onRamp providers that support the given currency", () => {
    const result = getRampServiceProviders("ethereum", apiData.onRamp);
    expect(result).toEqual(["coinify", "btcdirect", "paypal", "juno"]);
  });

  it("should return null if no API data in the catalog", () => {
    const result = getRampServiceProviders("ethereum", {});

    expect(result).toEqual(null);
  });
});
