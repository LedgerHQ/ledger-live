import { validateAddress as taquitoValidateAddress, ValidationResult } from "@taquito/utils";
import { validateAddress } from "./validateAddress";

jest.mock("@taquito/utils", () => {
  return {
    ...jest.requireActual("@taquito/utils"),
    validateAddress: jest.fn(),
  };
});

describe("validateAddress", () => {
  const mockedTaquitoValidateAddress = jest.mocked(taquitoValidateAddress);

  beforeEach(() => {
    mockedTaquitoValidateAddress.mockClear();
  });

  it.each([true, false])(
    "should call validateAddress from taquito and return expected value (%s)",
    async (expectedValue: boolean) => {
      if (expectedValue) {
        mockedTaquitoValidateAddress.mockReturnValueOnce(ValidationResult.VALID);
      } else {
        mockedTaquitoValidateAddress.mockReturnValueOnce(ValidationResult.OTHER);
      }

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedTaquitoValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockedTaquitoValidateAddress).toHaveBeenCalledWith(address);
    },
  );
});
