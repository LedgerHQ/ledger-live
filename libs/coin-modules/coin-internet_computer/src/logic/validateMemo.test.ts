import { validateMemo } from "./validateMemo";
import { validateMemo as icpValidateMemo } from "@zondax/ledger-live-icp/utils";

jest.mock("@zondax/ledger-live-icp/utils");

describe("validateMemo", () => {
  const mockedIcpValidateMemo = jest.mocked(icpValidateMemo);

  beforeEach(() => {
    mockedIcpValidateMemo.mockClear();
  });

  it.each([true, false])(
    "should return the result from ICP validateMemo (%s)",
    (expectedResult: boolean) => {
      mockedIcpValidateMemo.mockReturnValueOnce({ isValid: expectedResult });
      const result = validateMemo("some random memo");
      expect(result).toBe(expectedResult);
    },
  );
});
