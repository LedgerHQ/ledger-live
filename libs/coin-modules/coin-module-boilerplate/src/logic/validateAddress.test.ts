import { isRecipientValid } from "./utils";
import { validateAddress } from "./validateAddress";

jest.mock("../logic/utils");

describe("validateAddress", () => {
  const mockedIsRecipientValid = jest.mocked(isRecipientValid);

  beforeEach(() => {
    mockedIsRecipientValid.mockClear();
  });

  it.each([true, false])(
    "should call isValidAddress and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsRecipientValid.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsRecipientValid).toHaveBeenCalledTimes(1);
      expect(mockedIsRecipientValid).toHaveBeenCalledWith(address);
    },
  );
});
