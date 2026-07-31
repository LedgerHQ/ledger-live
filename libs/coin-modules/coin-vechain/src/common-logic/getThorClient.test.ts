import { getThorClient } from "./getThorClient";
import { ThorClient } from "@vechain/sdk-network";
import { setCoinConfig } from "../config";

// Mock the ThorClient
jest.mock("@vechain/sdk-network", () => ({
  ThorClient: {
    at: jest.fn(),
  },
}));

const NODE_URL = "https://testnet.veblocks.net";

const mockedThorClient = jest.mocked(ThorClient);

describe("getThorClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The endpoint comes from the coin config, not from the environment.
    setCoinConfig(() => ({ status: { type: "active" }, node: { url: NODE_URL } }));
  });

  it("should create a ThorClient instance with the configured node url", () => {
    const mockClient = {
      /* mock ThorClient properties */
    };
    mockedThorClient.at.mockReturnValue(mockClient as any);

    const result = getThorClient();

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

    const result = getThorClient();

    expect(result).toEqual(mockClient);
  });

  it("should call ThorClient.at exactly once", () => {
    const mockClient = {};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    getThorClient();

    expect(mockedThorClient.at).toHaveBeenCalledTimes(1);
  });

  it("should use the url from the coin config", () => {
    const mockClient = {};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    getThorClient();

    expect(mockedThorClient.at).toHaveBeenCalledWith("https://testnet.veblocks.net");
  });
});
