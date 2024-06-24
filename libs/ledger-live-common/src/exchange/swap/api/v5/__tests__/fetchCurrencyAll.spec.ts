import network from "@ledgerhq/live-network/network";
import { fetchCurrencyAll } from "../fetchCurrencyAll";
import { fetchCurrencyAllMock } from "../__mocks__/fetchCurrencyAll.mocks";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../const/timeout";
import { flattenV5CurrenciesAll } from "../../../utils/flattenV5CurrenciesAll";

jest.mock("@ledgerhq/live-network/network");

describe("fetchCurrencyAll", () => {
  it("success with 200", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: fetchCurrencyAllMock,
    }));
    const providers = ["changelly", "cic", "moonpay", "oneinch", "paraswap"];

    const result = await fetchCurrencyAll({ providers });

    expect(result).toStrictEqual(flattenV5CurrenciesAll(fetchCurrencyAllMock));
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap.ledger.com/v5/currencies/all?providers-whitelist=changelly%2Ccic%2Cmoonpay%2Coneinch%2Cparaswap&additional-coins-flag=false",
    });
  });
});
