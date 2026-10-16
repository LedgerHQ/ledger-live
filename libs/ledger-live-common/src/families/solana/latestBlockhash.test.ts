import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";
import { latestBlockhashReader } from "./latestBlockhash";

const mockGetLatestBlockhash = jest.fn();
jest.mock("@ledgerhq/coin-solana/network/index", () => ({
  getChainAPI: jest.fn(() => ({ getLatestBlockhash: mockGetLatestBlockhash })),
}));
jest.mock("../../bridge/generic-coin-framework/portfolio/config", () => ({
  isPortfolioEnabledFor: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe("latestBlockhashReader", () => {
  it("reads the latest confirmed blockhash of the endpoint on the legacy path", async () => {
    jest.mocked(isPortfolioEnabledFor).mockReturnValue(false);
    mockGetLatestBlockhash.mockResolvedValue({ blockhash: "fresh", lastValidBlockHeight: 1 });

    const read = latestBlockhashReader("solana", "https://rpc.test");

    expect(getChainAPI).not.toHaveBeenCalled();
    await expect(read?.()).resolves.toBe("fresh");
    expect(isPortfolioEnabledFor).toHaveBeenCalledWith("solana");
    expect(getChainAPI).toHaveBeenCalledWith({ endpoint: "https://rpc.test" });
    expect(mockGetLatestBlockhash).toHaveBeenCalledWith("confirmed");
  });

  it("reads nothing when the portfolio layer serves the currency", () => {
    jest.mocked(isPortfolioEnabledFor).mockReturnValue(true);

    expect(latestBlockhashReader("solana", "https://rpc.test")).toBeUndefined();
    expect(getChainAPI).not.toHaveBeenCalled();
  });
});
