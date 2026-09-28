import { renderHook } from "@tests/test-renderer";
import { usePayTabViewModel } from "../usePayTabViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ params: undefined }),
}));

describe("usePayTabViewModel", () => {
  it("hands the card the counter value formatter, so the face carries a balance", () => {
    const { result } = renderHook(() => usePayTabViewModel());

    // 1250 is the counter value's smallest unit, so USD reads 12.50.
    expect(result.current.cardFormatters?.countervalue?.(1250)).toMatchObject({
      integerPart: "12",
      decimalPart: "50",
    });
  });
});
