import { isValidAddress } from "./logic";
import { validateAddress } from "./validateAddress";

jest.mock("./logic");

describe("validateAddress", () => {
  const mockedIsValidAddress = jest.mocked(isValidAddress);

  beforeEach(() => {
    mockedIsValidAddress.mockClear();
  });

  it("should throw an error when currency parameters miss networkId", async () => {
    await expect(validateAddress("some random address", {})).rejects.toThrow(
      "Missing networkId parameter on address validation for Cardano",
    );

    expect(mockedIsValidAddress).toHaveBeenCalledTimes(0);
  });

  it.each([true, false])(
    "should correcly call isAddressValid and return the correct result (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidAddress.mockReturnValueOnce(expectedValue);

      const result = await validateAddress("some random address", { networkId: 1 });
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidAddress).toHaveBeenCalledWith("some random address", 1);
    },
  );
});
