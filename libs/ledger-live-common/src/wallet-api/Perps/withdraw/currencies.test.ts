import { fetchCurrencyTo } from "../../../exchange/swap/api/v5/fetchCurrencyTo";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import { fetchPerpsWithdrawCurrencies } from "./currencies";

jest.mock("../../../exchange/swap/api/v5/fetchCurrencyTo");

const mockedFetchCurrencyTo = jest.mocked(fetchCurrencyTo);

describe("fetchPerpsWithdrawCurrencies", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists the currencies SwapKit can swap HyperCore USDC into", async () => {
    mockedFetchCurrencyTo.mockResolvedValue(["ethereum", "bitcoin"]);

    await expect(fetchPerpsWithdrawCurrencies()).resolves.toEqual(["ethereum", "bitcoin"]);
    expect(mockedFetchCurrencyTo).toHaveBeenCalledWith({
      currencyFromId: "hypercore",
      providers: [PERPS_SWAPKIT_PROVIDER],
    });
  });
});
