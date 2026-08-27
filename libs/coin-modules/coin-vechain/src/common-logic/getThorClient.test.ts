import { getThorClient } from "./getThorClient";
import { ThorClient } from "@vechain/sdk-network";
import type { VechainCurrencyConfig } from "../config";

// Mock the ThorClient
jest.mock("@vechain/sdk-network", () => ({
  ThorClient: {
    at: jest.fn(),
  },
}));

const NODE_URL = "https://testnet.veblocks.net";
// The endpoint comes from the coin config, threaded in explicitly.
const config: VechainCurrencyConfig = { status: { type: "active" }, node: { url: NODE_URL } };

const mockedThorClient = jest.mocked(ThorClient);

describe("getThorClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a ThorClient instance with the configured node url", () => {
    const mockClient = {/* mock ThorClient properties */};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    const result = getThorClient(config);

    expect(mockedThorClient.at).toHaveBeenCalledWith(NODE_URL);
    expect(result).toBe(mockClient);
  });

  it("should return the same type of object from ThorClient.at", () => {
    const mockClient = {
      test: "thorClient",
      transactions: {},
      gas: {},
    };
    mockedThorClient.at.mockReturnValue(mockClient as any);

    const result = getThorClient(config);

    expect(result).toEqual(mockClient);
  });

  it("should call ThorClient.at exactly once", () => {
    const mockClient = {};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    getThorClient(config);

    expect(mockedThorClient.at).toHaveBeenCalledTimes(1);
  });

  it("should use the url from the coin config", () => {
    const mockClient = {};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    getThorClient(config);

    expect(mockedThorClient.at).toHaveBeenCalledWith("https://testnet.veblocks.net");
  });
});
