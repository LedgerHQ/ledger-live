import { safeParseAccountId } from "../logic/utils";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { validateAddress } from "./validateAddress";

jest.mock("../logic/utils");

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
        mockedSafeParseAccountId.mockReturnValueOnce([null, { accountId: "", checksum: "" }]);
      } else {
        mockedSafeParseAccountId.mockReturnValueOnce([new Error(), null]);
      }

      const address = "some random address";
      const parameters = { currency: mockCurrency };
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedSafeParseAccountId).toHaveBeenCalledTimes(1);
      expect(mockedSafeParseAccountId).toHaveBeenCalledWith({ currency: mockCurrency, address });
    },
  );
});
