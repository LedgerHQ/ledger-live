import network from "@ledgerhq/live-network/network";
import { fetchCurrencyAll } from "../fetchCurrencyAll";
import { fetchCurrencyAllMock } from "../__mocks__/fetchCurrencyAll.mocks";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../const/timeout";

jest.mock("@ledgerhq/live-network/network");

describe("fetchCurrencyAll", () => {
  it("success with 200", async () => {
    (network as jest.Mock).mockImplementation(() => ({
      data: fetchCurrencyAllMock,
    }));

    const result = await fetchCurrencyAll({
      providers: ["oneinch"],
    });

    expect(result).toStrictEqual(fetchCurrencyAllMock);
    expect(network as jest.Mock).toHaveBeenCalledWith({
      method: "GET",
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      url: "https://swap-stg.ledger.com/v5/currencies/all?providers-whitelist=oneinch&additional-coins-flag=false",
    });
  });
});
