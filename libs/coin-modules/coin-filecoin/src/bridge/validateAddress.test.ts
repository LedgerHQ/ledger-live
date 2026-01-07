import {
  validateAddress as networkValidateAddress,
  ValidateAddressResult,
} from "../network/addresses";
import { validateAddress } from "./validateAddress";

jest.mock("../network/addresses");

describe("validateAddress", () => {
  const mockedNetworkValidateAddress = jest.mocked(networkValidateAddress);

  beforeEach(() => {
    mockedNetworkValidateAddress.mockClear();
  });

  it.each([true, false])(
    "should call validateAddress and return the expected value (%s)",
    async (expectedValue: boolean) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      mockedNetworkValidateAddress.mockReturnValueOnce({
        isValid: expectedValue,
      } as unknown as ValidateAddressResult);

      const address = "some random address";
      const parameters = {};

      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedNetworkValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockedNetworkValidateAddress).toHaveBeenCalledWith(address);
    },
  );
});
