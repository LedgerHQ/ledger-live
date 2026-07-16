import network from "@ledgerhq/live-network";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import { getOkxTransaction } from "./okx";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const getSwapAPIBaseURLMock = jest.mocked(getSwapAPIBaseURL);

describe("getOkxTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSwapAPIBaseURLMock.mockReturnValue("https://swap.test");
  });

  it("fetches OKX calldata through live-network", async () => {
    const swapResponse = {
      to: "0xto",
      data: "0xdata",
      value: 0,
      gasLimit: 21000,
    };
    const networkResponse: Awaited<ReturnType<typeof network>> = {
      data: { swapResponse },
      status: 200,
    };
    mockedNetwork.mockResolvedValueOnce(networkResponse);

    const result = await getOkxTransaction({
      customFields: {
        quoteId: "quote-1",
        chainId: 1,
      },
    });

    expect(result).toEqual(swapResponse);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.test/okx/swap",
      data: {
        quoteId: "quote-1",
        chainId: 1,
      },
      headers: { "Content-Type": "application/json" },
    });
  });
});
