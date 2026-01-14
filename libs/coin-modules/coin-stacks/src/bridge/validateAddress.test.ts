import { validateAddress as utilsValidateAddress } from "./utils/addresses";
import { validateAddress } from "./validateAddress";

jest.mock("./utils/addresses");

describe("validateAddress", () => {
  const mockedUtilsValidateAddress = jest.mocked(utilsValidateAddress);

  beforeEach(() => {
    mockedUtilsValidateAddress.mockClear();
  });

  it.each([true, false])(
    "should call validateAddress from utils and return expected value (%s)",
    async (expectedValue: boolean) => {
      if (expectedValue) {
        mockedUtilsValidateAddress.mockReturnValueOnce({
          isValid: expectedValue,
          data: { version: 0, data: "" },
        });
      } else {
        mockedUtilsValidateAddress.mockReturnValueOnce({
          isValid: expectedValue,
          error: {},
        });
      }

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedUtilsValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockedUtilsValidateAddress).toHaveBeenCalledWith(address);
    },
  );
});
