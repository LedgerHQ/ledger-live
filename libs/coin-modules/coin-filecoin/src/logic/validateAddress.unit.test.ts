import {
  validateAddress as networkValidateAddress,
  ValidateAddressResult,
} from "../network/addresses";
import { validateAddress } from "./validateAddress";

jest.mock("../network/addresses");
jest.mock("@ledgerhq/logs");

const mockedNetworkValidateAddress = jest.mocked(networkValidateAddress);

describe("validateAddress (logic)", () => {
  beforeEach(() => {
    mockedNetworkValidateAddress.mockClear();
  });

  it.each([true, false])(
    "delegates to network.validateAddress and returns isValid=%s",
    async (expected: boolean) => {
      mockedNetworkValidateAddress.mockReturnValueOnce({
        isValid: expected,
      } as unknown as ValidateAddressResult);

      const result = await validateAddress("any-input", {});
      expect(result).toBe(expected);
      expect(mockedNetworkValidateAddress).toHaveBeenCalledWith("any-input");
    },
  );
});
