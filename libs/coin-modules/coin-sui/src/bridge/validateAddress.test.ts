import { isValidSuiAddress } from "@mysten/sui/utils";
import { validateAddress } from "./validateAddress";

jest.mock("@mysten/sui/utils");

describe("validateAddress", () => {
  const mockedIsValidSuiAddress = jest.mocked(isValidSuiAddress);

  beforeEach(() => {
    mockedIsValidSuiAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidSuiAddress and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidSuiAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidSuiAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidSuiAddress).toHaveBeenCalledWith(address);
    },
  );
});
