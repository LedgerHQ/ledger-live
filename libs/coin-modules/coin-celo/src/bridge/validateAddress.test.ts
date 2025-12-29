import { isValidAddress } from "@celo/utils/lib/address";
import { validateAddress } from "./validateAddress";

jest.mock("@celo/utils/lib/address");

describe("validateAddress", () => {
  const mockedIsValidAddress = jest.mocked(isValidAddress);

  beforeEach(() => {
    mockedIsValidAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidAddress and return the correct result (%s)",
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
