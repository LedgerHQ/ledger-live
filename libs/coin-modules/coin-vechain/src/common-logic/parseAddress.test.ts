import { parseAddress } from "./parseAddress";
import { Address } from "@vechain/sdk-core";
import { fixPrefixCase } from "./fixPrefixCase";

// Mock dependencies
jest.mock("@vechain/sdk-core", () => ({
  Address: {
    isValid: jest.fn(),
  },
}));

jest.mock("./fixPrefixCase");

const mockedAddress = jest.mocked(Address);
const mockedFixPrefixCase = jest.mocked(fixPrefixCase);

describe("parseAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for a valid address", () => {
    const inputAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const fixedAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(true);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(true);
  });

  it("should return false for an invalid address", () => {
    const inputAddress = "invalid-address";
    const fixedAddress = "0xinvalid-address";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(false);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(false);
  });

  it("should handle address without 0x prefix", () => {
    const inputAddress = "742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const fixedAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(true);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(true);
  });

  it("should handle address with uppercase 0X prefix", () => {
    const inputAddress = "0X742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
    const fixedAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(true);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(true);
  });

  it("should handle empty string", () => {
    const inputAddress = "";
    const fixedAddress = "0x";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(false);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(false);
  });

  it("should handle short address", () => {
    const inputAddress = "0x123";
    const fixedAddress = "0x123";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(false);

    const result = parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
    expect(result).toBe(false);
  });

  it("should call fixPrefixCase before validation", () => {
    const inputAddress = "test-address";
    const fixedAddress = "0xtest-address";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(false);

    parseAddress(inputAddress);

    expect(mockedFixPrefixCase).toHaveBeenCalledWith(inputAddress);
    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
  });

  it("should pass the fixed address to Address.isValid", () => {
    const inputAddress = "some-input";
    const fixedAddress = "0xsome-input";

    mockedFixPrefixCase.mockReturnValue(fixedAddress);
    mockedAddress.isValid.mockReturnValue(true);

    parseAddress(inputAddress);

    expect(mockedAddress.isValid).toHaveBeenCalledWith(fixedAddress);
  });
});
