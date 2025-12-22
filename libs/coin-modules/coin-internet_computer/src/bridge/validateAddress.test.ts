import { validateAddress as zondaxValidateAddress } from "@zondax/ledger-live-icp/utils";
import { validateAddress } from "./validateAddress";

jest.mock("@zondax/ledger-live-icp/utils");

describe("validateAddress", () => {
  const mockedZondaxValidateAddress = jest.mocked(zondaxValidateAddress);

  beforeEach(() => {
    mockedZondaxValidateAddress.mockClear();
  });

  it.each([true, false])(
    "should call validateAddress from Zondax and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedZondaxValidateAddress.mockReturnValueOnce({ isValid: expectedValue });

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedZondaxValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockedZondaxValidateAddress).toHaveBeenCalledWith(address);
    },
  );
});
