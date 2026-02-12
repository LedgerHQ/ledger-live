import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { isRecipientValid } from "../logic";
import { validateAddress } from "./validateAddress";

jest.mock("../logic");

describe("validateAddress", () => {
  const mockedIsRecipientValid = jest.mocked(isRecipientValid);

  beforeEach(() => {
    mockedIsRecipientValid.mockClear();
  });

  it.each([true, false])(
    "should return the correcu result from isRecipientValid",
    async (expectedValue: boolean) => {
      mockedIsRecipientValid.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const parameters = {} as unknown as AddressValidationCurrencyParameters;
      const result = await validateAddress(address, parameters);

      expect(result).toEqual(expectedValue);
    },
  );
});
