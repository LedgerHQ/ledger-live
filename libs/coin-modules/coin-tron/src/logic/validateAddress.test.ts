import { validateAddress as networkValidateAddress } from "../network";
import { validateAddress } from "./validateAddress";

jest.mock("../network");

describe("validateAddress", () => {
  const mockedNetworkValidateAddress = jest.mocked(networkValidateAddress);

  beforeEach(() => {
    mockedNetworkValidateAddress.mockClear();
  });

  it.each([true, false])(
    "should call validateAddress from network and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedNetworkValidateAddress.mockResolvedValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedNetworkValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockedNetworkValidateAddress).toHaveBeenCalledWith(address);
    },
  );
});
