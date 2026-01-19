import { safeParseAccountId } from "../network/utils";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { validateAddress } from "./validateAddress";

jest.mock("../network/utils");

describe("validateAddress", () => {
  const mockCurrency = getMockedCurrency();
  const mockedSafeParseAccountId = jest.mocked(safeParseAccountId);

  beforeEach(() => {
    mockedSafeParseAccountId.mockClear();
  });

  it.each([true, false])(
    "should call safeParseAccountId and return expected value (%s)",
    async (expectedValue: boolean) => {
      if (expectedValue) {
        mockedSafeParseAccountId.mockResolvedValueOnce([null, { accountId: "", checksum: "" }]);
      } else {
        mockedSafeParseAccountId.mockResolvedValueOnce([new Error(), null]);
      }

      const address = "some random address";
      const parameters = { currencyId: mockCurrency.id };
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedSafeParseAccountId).toHaveBeenCalledTimes(1);
      expect(mockedSafeParseAccountId).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        address,
      });
    },
  );
});
