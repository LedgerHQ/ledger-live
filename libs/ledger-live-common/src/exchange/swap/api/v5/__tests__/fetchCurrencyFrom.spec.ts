import network from "@ledgerhq/live-network/network";
import { fetchCurrencyFrom } from "../fetchCurrencyFrom";
import { fetchCurrencyFromMock } from "../__mocks__/fetchCurrencyFrom.mocks";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../const/timeout";
import { flattenV5CurrenciesToAndFrom } from "../../../utils/flattenV5CurrenciesToAndFrom";

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

    expect(result).toStrictEqual(flattenV5CurrenciesToAndFrom(fetchCurrencyFromMock));
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap.ledger.com/v5/currencies/from?providers-whitelist=changelly%2Ccic%2Coneinch&additional-coins-flag=false&currency-to=bitcoin",
    });
  });
});
