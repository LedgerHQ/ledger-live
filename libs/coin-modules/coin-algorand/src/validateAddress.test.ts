import { isValidAddress } from "algosdk";
import { validateAddress } from "./validateAddress";

jest.mock("algosdk");

describe("validateAddress", () => {
  const mockedIsValidAddress = jest.mocked(isValidAddress);

  beforeEach(() => {
    mockedIsValidAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidAddress from algosdk and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidAddress).toHaveBeenCalledWith(address);
    },
  );
});
