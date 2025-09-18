import { getThorClient } from "./getThorClient";
import { ThorClient } from "@vechain/sdk-network";
import { VECHAIN_NODE_URL } from "../constants";

// Mock the ThorClient
jest.mock("@vechain/sdk-network", () => ({
  ThorClient: {
    at: jest.fn(),
  },
}));

// Mock the constants
jest.mock("../constants", () => ({
  VECHAIN_NODE_URL: "https://testnet.veblocks.net",
}));

const mockedThorClient = jest.mocked(ThorClient);

describe("getThorClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a ThorClient instance with VECHAIN_NODE_URL", () => {
    const mockClient = {
      /* mock ThorClient properties */
    };
    mockedThorClient.at.mockReturnValue(mockClient as any);

    const result = getThorClient();

    expect(mockedThorClient.at).toHaveBeenCalledWith(VECHAIN_NODE_URL);
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

  it("should use the correct URL from constants", () => {
    const mockClient = {};
    mockedThorClient.at.mockReturnValue(mockClient as any);

    getThorClient();

    expect(mockedThorClient.at).toHaveBeenCalledWith("https://testnet.veblocks.net");
  });
});
