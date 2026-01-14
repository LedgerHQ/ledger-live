import { isAddressValid } from "./bridgeHelpers/addresses";
import { validateAddress } from "./validateAddress";

jest.mock("./bridgeHelpers/addresses");

describe("validateAddress", () => {
  const mockedIsAddressValid = jest.mocked(isAddressValid);

  beforeEach(() => {
    mockedIsAddressValid.mockClear();
  });

  it.each([true, false])(
    "should correcly call isAddressValid and return the correct result (%s)",
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
