import network from "@ledgerhq/live-network";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import { getUniswapTransaction } from "./uniswap";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const getSwapAPIBaseURLMock = jest.mocked(getSwapAPIBaseURL);

describe("getUniswapTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSwapAPIBaseURLMock.mockReturnValue("https://swap.test");
  });

  it("fetches Uniswap calldata through live-network", async () => {
    const uniswapCallDataResponse = {
      gasFee: "100",
      requestId: "request-1",
      swap: {
        chainId: 1,
        data: "0xdata",
        from: "0xfrom",
        gasLimit: "21000",
        maxFeePerGas: "1",
        maxPriorityFeePerGas: "1",
        to: "0xto",
        value: "0",
      },
    };
    const networkResponse: Awaited<ReturnType<typeof network>> = {
      data: { uniswapCallDataResponse },
      status: 200,
    };
    mockedNetwork.mockResolvedValueOnce(networkResponse);

    const result = await getUniswapTransaction({
      customFields: {
        quoteId: "quote-1",
        chainId: 1,
      },
      permitSignature: "0xsignature",
    });

    expect(result).toEqual(uniswapCallDataResponse);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.test/uniswap/swap",
      data: {
        quoteId: "quote-1",
        chainId: 1,
        signature: "0xsignature",
      },
      headers: { "Content-Type": "application/json" },
    });
  });
});
