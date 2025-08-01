import { generateNonce } from "./generateNonce";
import { Hex } from "@vechain/sdk-core";

// Mock the Hex.random method
jest.mock("@vechain/sdk-core", () => ({
  Hex: {
    random: jest.fn(),
  },
}));

const mockedHex = jest.mocked(Hex);

describe("generateNonce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a nonce using Hex.random with length 8", () => {
    const mockHexValue = {
      toString: jest.fn().mockReturnValue("0x1234567890abcdef"),
    };
    mockedHex.random.mockReturnValue(mockHexValue as any);

    const result = generateNonce();

    expect(mockedHex.random).toHaveBeenCalledWith(8);
    expect(mockHexValue.toString).toHaveBeenCalled();
    expect(result).toBe("0x1234567890abcdef");
  });

  it("should return a string", () => {
    const mockHexValue = {
      toString: jest.fn().mockReturnValue("0xabcdef1234567890"),
    };
    mockedHex.random.mockReturnValue(mockHexValue as any);

    const result = generateNonce();

    expect(typeof result).toBe("string");
  });

  it("should call toString on the hex value", () => {
    const mockHexValue = {
      toString: jest.fn().mockReturnValue("0x123456789abcdef0"),
    };
    mockedHex.random.mockReturnValue(mockHexValue as any);

    generateNonce();

    expect(mockHexValue.toString).toHaveBeenCalledTimes(1);
  });

  it("should handle different hex values", () => {
    const testCases = [
      "0x0000000000000000",
      "0xffffffffffffffff",
      "0x123456789abcdef0",
      "0xa1b2c3d4e5f67890",
    ];

    testCases.forEach(expectedValue => {
      const mockHexValue = {
        toString: jest.fn().mockReturnValue(expectedValue),
      };
      mockedHex.random.mockReturnValue(mockHexValue as any);

      const result = generateNonce();

      expect(result).toBe(expectedValue);
    });
  });
});
