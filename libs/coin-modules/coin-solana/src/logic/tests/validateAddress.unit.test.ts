import { isValidBase58Address } from "../../logic";
import { validateAddress } from "../validateAddress";

jest.mock("../../logic", () => ({
  ...jest.requireActual("../../logic"),
  isValidBase58Address: jest.fn(jest.requireActual("../../logic").isValidBase58Address),
}));

describe("validateAddress", () => {
  const mockedIsValidBase58Address = jest.mocked(isValidBase58Address);

  beforeEach(() => {
    mockedIsValidBase58Address.mockClear();
  });

  it("should return true for a valid base58 Solana address", async () => {
    const result = await validateAddress("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM", {});
    expect(result).toBe(true);
  });

  it("should return true for another valid address", async () => {
    const result = await validateAddress("7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE", {});
    expect(result).toBe(true);
  });

  it("should return false for an invalid address", async () => {
    const result = await validateAddress("not-a-valid-address!!!", {});
    expect(result).toBe(false);
  });

  it("should return false for an empty string", async () => {
    const result = await validateAddress("", {});
    expect(result).toBe(false);
  });

  it("should return false for a string with invalid characters", async () => {
    const result = await validateAddress("0OIl", {});
    expect(result).toBe(false);
  });

  it.each([true, false])(
    "should call isValidBase58Address and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidBase58Address.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidBase58Address).toHaveBeenCalledTimes(1);
      expect(mockedIsValidBase58Address).toHaveBeenCalledWith(address);
    },
  );
});
