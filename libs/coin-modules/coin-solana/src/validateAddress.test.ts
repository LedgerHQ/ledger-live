import { isValidBase58Address } from "./logic";
import { validateAddress } from "./validateAddress";

jest.mock("./logic");

describe("validateAddress", () => {
  const mockedIsValidBase58Address = jest.mocked(isValidBase58Address);

  beforeEach(() => {
    mockedIsValidBase58Address.mockClear();
  });

  it.each([true, false])(
    "should call isValidBase58Address and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidBase58Address.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidBase58Address).toHaveBeenCalledTimes(1);
      expect(mockedIsValidBase58Address).toHaveBeenCalledWith(address);
    },
  );
});
