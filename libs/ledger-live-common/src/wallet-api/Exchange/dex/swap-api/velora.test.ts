import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import { getVeloraTransaction } from "./velora";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const getSwapAPIBaseURLMock = jest.mocked(getSwapAPIBaseURL);

describe("getVeloraTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSwapAPIBaseURLMock.mockReturnValue("https://swap.test");
  });

  it("fetches Velora calldata through live-network", async () => {
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
    const swapData: Parameters<typeof getVeloraTransaction>[0] = {
      "@type": "VeloraSwapCustomFields",
      ledgerIdFrom: "ethereum",
      srcToken: "0xsrc",
      destToken: "0xdest",
      userAddress: "0xfrom",
      originAddress: null,
      receiverAddress: "0xto",
      amountFrom: new BigNumber(1),
      slippage: 0.5,
      priceRoute: {
        srcToken: "0xsrc",
        destToken: "0xdest",
        route: "best",
      },
      swapResponse: null,
    };
    mockedNetwork.mockResolvedValueOnce(networkResponse);

    const result = await getVeloraTransaction(swapData);

    expect(result).toEqual(swapResponse);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: "https://swap.test/velora/swap",
      data: swapData,
      headers: { "Content-Type": "application/json" },
    });
  });
});
