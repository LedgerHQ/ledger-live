import type { AssetsData } from "@domain/api-aggregated-assets";
import { mockAssetsData } from "@domain/api-aggregated-assets/mock";
import { getSwapCurrencyIds } from "../getSwapCurrencyIds";

const usdcOnEthereum = "ethereum/erc20/usd__coin";
const usdcOnSolana = "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v";
const usdcOnAlgorand = "algorand/asa/31566704";

const usdcData = {
  ...mockAssetsData,
  cryptoAssets: {
    "urn:crypto:meta-currency:usd_coin": {
      id: "urn:crypto:meta-currency:usd_coin",
      ticker: "USDC",
      name: "USDC",
      assetsIds: { ethereum: usdcOnEthereum, solana: usdcOnSolana, algorand: usdcOnAlgorand },
    },
    "urn:crypto:meta-currency:arc_native_usdc": {
      id: "urn:crypto:meta-currency:arc_native_usdc",
      ticker: "USDC",
      name: "USDC",
      assetsIds: { arc: "arc" },
    },
  },
  currenciesOrder: {
    ...mockAssetsData.currenciesOrder,
    metaCurrencyIds: [
      "urn:crypto:meta-currency:usd_coin",
      "urn:crypto:meta-currency:arc_native_usdc",
    ],
  },
} as AssetsData;

describe("getSwapCurrencyIds", () => {
  it("keeps the swappable networks of the asset group only", () => {
    const swappableCurrencyIds = [usdcOnEthereum, usdcOnSolana, "arc", "bitcoin"];

    expect(getSwapCurrencyIds(usdcData, usdcOnEthereum, swappableCurrencyIds)).toEqual([
      usdcOnEthereum,
      usdcOnSolana,
    ]);
  });

  it("keeps every network of the asset group while the swappable list is empty", () => {
    expect(getSwapCurrencyIds(usdcData, usdcOnEthereum, [])).toEqual([
      usdcOnEthereum,
      usdcOnSolana,
      usdcOnAlgorand,
    ]);
  });
});
