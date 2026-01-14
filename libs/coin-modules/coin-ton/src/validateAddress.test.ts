import { isAddressValid } from "./utils";
import { validateAddress } from "./validateAddress";

jest.mock("./utils");

describe("validateAddress", () => {
  const mockedIsAddressValid = jest.mocked(isAddressValid);

  beforeEach(() => {
    mockedIsAddressValid.mockClear();
  });

  it.each([true, false])(
    "should call isAddressValid from taquito and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsAddressValid.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsAddressValid).toHaveBeenCalledTimes(1);
      expect(mockedIsAddressValid).toHaveBeenCalledWith(address);
    },
  );
});
