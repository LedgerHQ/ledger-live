import { isValidClassicAddress } from "ripple-address-codec";
import { validateAddress } from "./validateAddress";

jest.mock("ripple-address-codec");

describe("validateAddress", () => {
  const mockedIsValidClassicAddress = jest.mocked(isValidClassicAddress);

  beforeEach(() => {
    mockedIsValidClassicAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidClassicAddress from ripple and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidClassicAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidClassicAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidClassicAddress).toHaveBeenCalledWith(address);
    },
  );
});
