import network from "@ledgerhq/live-network/network";
import { fetchCurrencyFrom } from "../fetchCurrencyFrom";
import { fetchCurrencyFromMock } from "../__mocks__/fetchCurrencyFrom.mocks";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../const/timeout";

jest.mock("@ledgerhq/live-network/network");

describe("fetchCurrencyFrom", () => {
  it("success with 200", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: fetchCurrencyFromMock,
    }));

    const result = await fetchCurrencyFrom({
      providers: ["changelly", "cic", "oneinch"],
      currencyTo: "bitcoin",
    });

    expect(result).toStrictEqual(fetchCurrencyFromMock);
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap-stg.ledger.com/v5/currencies/from?providers-whitelist=changelly%2Ccic%2Coneinch&additional-coins-flag=false&currencyTo=bitcoin",
    });
  });
});
