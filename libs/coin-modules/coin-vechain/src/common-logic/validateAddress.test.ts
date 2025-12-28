import { parseAddress } from "../common-logic";
import { validateAddress } from "./validateAddress";

jest.mock("../common-logic");

describe("validateAddress", () => {
  const mockedParseAddress = jest.mocked(parseAddress);

  beforeEach(() => {
    mockedParseAddress.mockClear();
  });

  it.each([true, false])(
    "should call parseAddress and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedParseAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedParseAddress).toHaveBeenCalledTimes(1);
      expect(mockedParseAddress).toHaveBeenCalledWith(address);
    },
  );
});
