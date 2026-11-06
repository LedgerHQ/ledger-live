import { isRecipientValid } from "../logic/utils";
import { validateAddress } from "./validateAddress";

jest.mock("../logic/utils");

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
