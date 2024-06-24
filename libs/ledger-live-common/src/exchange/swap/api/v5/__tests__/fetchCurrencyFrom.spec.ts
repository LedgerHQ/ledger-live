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

    const providers = ["changelly", "cic", "moonpay", "oneinch", "paraswap"];

    const result = await fetchCurrencyFrom({
      currencyTo: "bitcoin",
      providers,
    });

    expect(result).toStrictEqual(flattenV5CurrenciesToAndFrom(fetchCurrencyFromMock));
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap.ledger.com/v5/currencies/from?providers-whitelist=changelly%2Ccic%2Cmoonpay%2Coneinch%2Cparaswap&additional-coins-flag=false&currency-to=bitcoin",
    });
  });
});
