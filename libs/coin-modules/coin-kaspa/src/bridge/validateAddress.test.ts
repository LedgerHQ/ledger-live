import { isValidKaspaAddress } from "../logic";
import { validateAddress } from "./validateAddress";

jest.mock("../logic");

describe("validateAddress", () => {
  const mockedIsValidKaspaAddress = jest.mocked(isValidKaspaAddress);

  beforeEach(() => {
    mockedIsValidKaspaAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidKaspaAddress and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidKaspaAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidKaspaAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidKaspaAddress).toHaveBeenCalledWith(address);
    },
  );
});
