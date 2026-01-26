import * as algosdk from "algosdk";
import { validateAddress } from "./validateAddress";

jest.mock("algosdk", () => ({
  isValidAddress: jest.fn(),
}));

const mockIsValidAddress = algosdk.isValidAddress as jest.MockedFunction<
  typeof algosdk.isValidAddress
>;

describe("validateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for valid addresses", () => {
    mockIsValidAddress.mockReturnValue(true);

    const result = validateAddress("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ");

    expect(result).toBe(true);
    expect(mockIsValidAddress).toHaveBeenCalledWith(
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    );
  });

  it("should return false for invalid addresses", () => {
    mockIsValidAddress.mockReturnValue(false);

    const result = validateAddress("invalid_address");

    expect(result).toBe(false);
    expect(mockIsValidAddress).toHaveBeenCalledWith("invalid_address");
  });

  it("should return false for empty string", () => {
    mockIsValidAddress.mockReturnValue(false);

    const result = validateAddress("");

    expect(result).toBe(false);
  });

  it("should delegate to algosdk.isValidAddress", () => {
    mockIsValidAddress.mockReturnValue(true);

    validateAddress("test_address");

    expect(mockIsValidAddress).toHaveBeenCalledTimes(1);
    expect(mockIsValidAddress).toHaveBeenCalledWith("test_address");
  });
});
