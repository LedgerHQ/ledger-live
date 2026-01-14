import { InvalidAddress } from "@ledgerhq/errors";
import { validateRecipient } from "./cache";
import { validateAddress } from "./validateAddress";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("./cache");

describe("validateAddress", () => {
  const mockedValidateRecipient = jest.mocked(validateRecipient);

  beforeEach(() => {
    mockedValidateRecipient.mockClear();
  });

  it("should return throw an error when currency parameter is absent", async () => {
    const address = "some random address";
    const parameters = {};

    await expect(() => validateAddress(address, parameters)).rejects.toThrow(
      "Missing currency parameter for address validation on Bitcoin",
    );

    expect(mockedValidateRecipient).toHaveBeenCalledTimes(0);
  });

  it.each([true, false])(
    "should call AccountAddress from aptos and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedValidateRecipient.mockResolvedValueOnce({
        recipientError: expectedValue ? null : new InvalidAddress(),
        recipientWarning: null,
        changeAddressError: null,
        changeAddressWarning: null,
      });

      const address = "some random address";
      const parameters = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        currency: {} as CryptoCurrency,
      };
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedValidateRecipient).toHaveBeenCalledTimes(1);
      expect(mockedValidateRecipient).toHaveBeenCalledWith(parameters.currency, address);
    },
  );
});
