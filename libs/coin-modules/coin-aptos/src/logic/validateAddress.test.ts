import { AccountAddress } from "@aptos-labs/ts-sdk";
import { validateAddress } from "./validateAddress";

AccountAddress.isValid = jest.fn();

describe("validateAddress", () => {
  const mockedAccountAddress = jest.mocked(AccountAddress.isValid);

  beforeEach(() => {
    mockedAccountAddress.mockClear();
  });

  it.each([true, false])(
    "should call AccountAddress from aptos and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedAccountAddress.mockReturnValueOnce({ valid: expectedValue });

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedAccountAddress).toHaveBeenCalledTimes(1);
      expect(mockedAccountAddress).toHaveBeenCalledWith({ input: address });
    },
  );
});
