import { isRecipientValid } from "../common-logic";
import { validateAddress } from "./validateAddress";

jest.mock("../common-logic");

describe("validateAddress", () => {
  const mockedIsRecipientValid = jest.mocked(isRecipientValid);

  beforeEach(() => {
    mockedIsRecipientValid.mockClear();
  });

  it.each([true, false])(
    "should call correctly isRecipientValid and return the correct value",
    async (expectedValue: boolean) => {
      mockedIsRecipientValid.mockReturnValueOnce(expectedValue);

      const result = await validateAddress("some random address", {});
      expect(result).toEqual(expectedValue);

      expect(mockedIsRecipientValid).toHaveBeenCalledTimes(1);
      expect(mockedIsRecipientValid).toHaveBeenCalledWith("some random address");
    },
  );
});
