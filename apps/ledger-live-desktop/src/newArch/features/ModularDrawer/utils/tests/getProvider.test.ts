import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getProvider } from "../getProvider";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { ethereumCurrency as mockedCurrency } from "../../__mocks__/useSelectAssetFlow.mock";
import { res as GroupedCurrencies } from "../../__mocks__/useGroupedCurrenciesByProvider.mock";

const MOCK_CURRENCY_BY_PROVIDER_ID = GroupedCurrencies.result.currenciesByProvider;

describe("getProvider", () => {
  it("should return the provider for a currency with a single provider", () => {
    const result = getProvider(
      mockedCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeDefined();
    expect(result?.providerId).toBe("ethereum");
  });

  it("should return the provider for a currency with multiple providers", () => {
    const result = getProvider(
      mockedCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeDefined();
    expect(result?.providerId).toBe("ethereum");
  });

  it("should return undefined for a currency with no provider", () => {
    const result = getProvider(
      { ...mockedCurrency, id: "nonexistent" } as CryptoOrTokenCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeUndefined();
  });
});
