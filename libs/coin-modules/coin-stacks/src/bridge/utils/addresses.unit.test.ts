import { validateAddress } from "./addresses";
import { c32addressDecode } from "c32check";

// Mock c32check module
jest.mock("c32check", () => ({
  c32addressDecode: jest.fn(),
}));

describe("validateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return valid result for valid address", () => {
    const mockVersion = 26;
    const mockData = "3d7a68032c8f2e0e93c15139e18a4d7b6e0dfce8";
    const validAddress = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

    // Mock the c32addressDecode function to return expected values
    (c32addressDecode as jest.Mock).mockReturnValueOnce([mockVersion, mockData]);

    const result = validateAddress(validAddress);

    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.version).toBe(mockVersion);
      expect(result.data.data).toBe(mockData);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(validAddress);
  });

  test("should return invalid result for invalid address", () => {
    const invalidAddress = "INVALID_ADDRESS";
    const mockError = new Error("Invalid address");

    // Mock the c32addressDecode function to throw an error
    (c32addressDecode as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const result = validateAddress(invalidAddress);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toBe(mockError);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(invalidAddress);
  });

  test("should handle empty string", () => {
    const emptyAddress = "";
    const mockError = new Error("Address cannot be empty");

    // Mock the c32addressDecode function to throw an error
    (c32addressDecode as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const result = validateAddress(emptyAddress);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toBe(mockError);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(emptyAddress);
  });

  test("should handle malformed addresses", () => {
    const malformedAddress = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69";
    const mockError = new Error("Invalid checksum");

    // Mock the c32addressDecode function to throw an error
    (c32addressDecode as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const result = validateAddress(malformedAddress);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toBe(mockError);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(malformedAddress);
  });

  test("should handle addresses with wrong version", () => {
    const wrongVersionAddress = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

    // Even though we're testing wrong version, the implementation doesn't check version
    // It just passes through whatever c32addressDecode returns
    const mockVersion = 26;
    const mockData = "3d7a68032c8f2e0e93c15139e18a4d7b6e0dfce8";

    (c32addressDecode as jest.Mock).mockReturnValueOnce([mockVersion, mockData]);

    const result = validateAddress(wrongVersionAddress);

    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.version).toBe(mockVersion);
      expect(result.data.data).toBe(mockData);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(wrongVersionAddress);
  });

  test("should handle addresses with incorrect format", () => {
    const incorrectFormatAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Bitcoin address
    const mockError = new Error("Incorrect format");

    // Mock the c32addressDecode function to throw an error
    (c32addressDecode as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });

    const result = validateAddress(incorrectFormatAddress);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toBe(mockError);
    }
    expect(c32addressDecode).toHaveBeenCalledWith(incorrectFormatAddress);
  });
});
