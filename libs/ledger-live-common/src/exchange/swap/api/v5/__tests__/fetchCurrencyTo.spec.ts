import network from "@ledgerhq/live-network/network";
import { fetchCurrencyTo } from "../fetchCurrencyTo";
import { fetchCurrencyToMock } from "../__mocks__/fetchCurrencyTo.mocks";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../const/timeout";

jest.mock("@ledgerhq/live-network/network");

describe("fetchCurrencyFrom", () => {
  it("success with 200", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: fetchCurrencyToMock,
    }));

    const result = await fetchCurrencyTo({
      providers: ["changelly", "cic", "oneinch"],
      currencyFrom: "bitcoin",
    });

    expect(result).toStrictEqual(fetchCurrencyToMock);
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap-stg.ledger.com/v5/currencies/to?providers-whitelist=changelly%2Ccic%2Coneinch&additional-coins-flag=false&currencyFrom=bitcoin",
    });
  });
});
