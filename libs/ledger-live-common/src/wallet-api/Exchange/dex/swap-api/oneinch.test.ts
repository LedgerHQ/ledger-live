import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import { getOneinchTransaction } from "./oneinch";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const getSwapAPIBaseURLMock = jest.mocked(getSwapAPIBaseURL);

describe("getOneinchTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSwapAPIBaseURLMock.mockReturnValue("https://swap.test");
  });

  it("fetches 1inch calldata through live-network", async () => {
    const swapResponse = {
      to: "0xto",
      data: "0xdata",
      value: "0",
      gasLimit: "21000",
    };
    const networkResponse: Awaited<ReturnType<typeof network>> = {
      data: { swapResponse },
      status: 200,
    };
    const swapData: Parameters<typeof getOneinchTransaction>[0] = {
      "@type": "OneInchSwapCustomFields",
      address: "0xfrom",
      amount: new BigNumber(1),
      ledgerIdFrom: "ethereum",
      ledgerIdTo: "ethereum/erc20/usdc",
      slippage: 0.5,
    };
    mockedNetwork.mockResolvedValueOnce(networkResponse);

    const result = await getOneinchTransaction(swapData);

    expect(result).toEqual(swapResponse);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.test/oneinch/swap",
      data: swapData,
      headers: { "Content-Type": "application/json" },
    });
  });
});
