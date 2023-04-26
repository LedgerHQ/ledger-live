import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { fetchCurrencyConfiguration } from ".";
import network from "../network";
jest.mock("../network");

describe("fetchCurrencyConfiguration", () => {
  it("should return the currency config", async () => {
    // @ts-expect-error method is mocked
    network.mockResolvedValue({});
    const config = await fetchCurrencyConfiguration({} as CryptoCurrency);
    expect(config).toBeDefined();
  });
});
