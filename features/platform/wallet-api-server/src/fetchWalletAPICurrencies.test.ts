import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { fetchWalletAPICurrencies, TOKEN_LOOKUP_CONCURRENCY } from "./fetchWalletAPICurrencies";

const dispatch = jest.fn();
const bitcoin = getCryptoCurrencyById("bitcoin");

describe("fetchWalletAPICurrencies", () => {
  it("lists the supported currencies the manifest names", async () => {
    const result = await fetchWalletAPICurrencies({
      manifestCurrencies: ["bitcoin"],
      supportedCurrencies: [bitcoin, getCryptoCurrencyById("litecoin")],
      findTokenById: jest.fn(),
    })(dispatch);

    expect(result).toEqual([expect.objectContaining({ id: "bitcoin", type: "CryptoCurrency" })]);
  });

  // QAA-1497: unbounded, the CAL lookups exhaust the pool and fail silently.
  it("never has more than TOKEN_LOOKUP_CONCURRENCY lookups in flight", async () => {
    const tokenIds = Array.from(
      { length: TOKEN_LOOKUP_CONCURRENCY * 8 },
      (_, i) => `ethereum/erc20/token_${i}`,
    );
    let inFlight = 0;
    let peakInFlight = 0;
    const findTokenById = jest.fn(async () => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 0));
      inFlight -= 1;
      return null;
    });

    await fetchWalletAPICurrencies({
      manifestCurrencies: "*",
      currencyIds: tokenIds,
      supportedCurrencies: [],
      findTokenById,
    })(dispatch);

    expect(findTokenById).toHaveBeenCalledTimes(tokenIds.length);
    expect(peakInFlight).toBeGreaterThan(1);
    expect(peakInFlight).toBeLessThanOrEqual(TOKEN_LOOKUP_CONCURRENCY);
  });

  it("omits a failed token lookup instead of failing the list", async () => {
    await expect(
      fetchWalletAPICurrencies({
        manifestCurrencies: "*",
        currencyIds: ["ethereum/erc20/usd__coin"],
        supportedCurrencies: [],
        findTokenById: jest.fn().mockRejectedValue(new Error("bad json")),
      })(dispatch),
    ).resolves.toEqual([]);
  });
});
