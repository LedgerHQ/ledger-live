import { validateAddress, validateMemo } from "./validation";

const mockFromHex = jest.fn();
const mockToHex = jest.fn();

jest.mock("@icp-sdk/canisters/ledger/icp", () => ({
  AccountIdentifier: {
    fromHex: (...args: unknown[]) => mockFromHex(...args),
  },
}));

describe("validateAddress", () => {
  beforeEach(() => {
    mockFromHex.mockClear();
    mockToHex.mockClear();
  });

  it("should return isValid true for a valid address", () => {
    mockToHex.mockReturnValue("abcd1234");
    mockFromHex.mockReturnValue({ toHex: mockToHex });

    const result = validateAddress("abcd1234");
    expect(result).toEqual({ isValid: true });
    expect(mockFromHex).toHaveBeenCalledWith("abcd1234");
  });

  it("should return isValid false when AccountIdentifier.fromHex returns null", () => {
    mockFromHex.mockReturnValue(null);

    const result = validateAddress("invalid");
    expect(result.isValid).toBe(false);
  });

  it("should return isValid false when toHex returns empty", () => {
    mockToHex.mockReturnValue("");
    mockFromHex.mockReturnValue({ toHex: mockToHex });

    const result = validateAddress("invalid");
    expect(result.isValid).toBe(false);
  });

  it("should return isValid false with error message when fromHex throws", () => {
    mockFromHex.mockImplementation(() => {
      throw new Error("Invalid account identifier");
    });

    const result = validateAddress("not-valid");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid account identifier");
  });

  it("should return default error when fromHex throws a non-Error", () => {
    mockFromHex.mockImplementation(() => {
      throw "string error";
    });

    const result = validateAddress("not-valid");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid address, account identifier could not be created.");
  });

  it("should return default error when fromHex throws Error with empty message", () => {
    mockFromHex.mockImplementation(() => {
      throw new Error("");
    });

    const result = validateAddress("not-valid");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid address, account identifier could not be created.");
  });
});

describe("validateMemo", () => {
  it("should return isValid true when memo is undefined", () => {
    const result = validateMemo(undefined);
    expect(result).toEqual({ isValid: true });
  });

  it("should return isValid true for valid memo '0'", () => {
    const result = validateMemo("0");
    expect(result).toEqual({ isValid: true });
  });

  it("should return isValid true for valid positive memo", () => {
    const result = validateMemo("12345");
    expect(result).toEqual({ isValid: true });
  });

  it("should return isValid true for large memo value", () => {
    const result = validateMemo("18446744073709551615");
    expect(result).toEqual({ isValid: true });
  });

  it("should return isValid false for negative memo", () => {
    const result = validateMemo("-1");
    expect(result).toEqual({ isValid: false });
  });

  it("should return isValid false with error for empty string", () => {
    const result = validateMemo("");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Memo cannot be empty or whitespace only");
  });

  it("should return isValid false with error for whitespace-only string", () => {
    const result = validateMemo("   ");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Memo cannot be empty or whitespace only");
  });

  it("should return isValid false with error for non-numeric memo", () => {
    const result = validateMemo("abc");
    expect(result.isValid).toBe(false);
  });

  it("should return isValid false with error for decimal memo", () => {
    const result = validateMemo("1.5");
    expect(result.isValid).toBe(false);
  });
});
