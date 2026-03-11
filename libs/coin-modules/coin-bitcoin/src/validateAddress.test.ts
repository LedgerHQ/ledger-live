import { validateAddress } from "./validateAddress";
import { isValidAddress } from "./wallet-btc/utils";

jest.mock("./wallet-btc/utils");

describe("validateAddress", () => {
  const mockedIsValidAddress = jest.mocked(isValidAddress);

  beforeEach(() => {
    mockedIsValidAddress.mockClear();
  });

  it("should return throw an error when currency parameter is absent", async () => {
    const address = "some random address";
    const parameters = {};

    await expect(() => validateAddress(address, parameters)).rejects.toThrow(
      "Missing currency parameter for address validation on Bitcoin",
    );

    expect(mockedIsValidAddress).toHaveBeenCalledTimes(0);
  });

  it.each([true, false])(
    "should call isValidAddress from Bitcoin and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidAddress.mockResolvedValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {
        currencyId: "bitcoin",
      };
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidAddress).toHaveBeenCalledTimes(1);
      expect(mockedIsValidAddress).toHaveBeenCalledWith(address, parameters.currencyId);
    },
  );
});
