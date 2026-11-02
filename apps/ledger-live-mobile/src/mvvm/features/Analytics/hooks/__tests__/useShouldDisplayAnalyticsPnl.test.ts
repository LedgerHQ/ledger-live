import { renderHook } from "@testing-library/react-native";
import { useSelector } from "~/context/hooks";
import { useShouldDisplayAnalyticsPnl } from "../useShouldDisplayAnalyticsPnl";

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

const mockAccount = { id: "acc-1" };

describe("useShouldDisplayAnalyticsPnl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue([mockAccount]);
  });

  it("returns true when accounts exist", () => {
    const { result } = renderHook(() => useShouldDisplayAnalyticsPnl());

    expect(result.current).toBe(true);
  });

  it("returns false when there are no accounts", () => {
    mockUseSelector.mockReturnValue([]);

    const { result } = renderHook(() => useShouldDisplayAnalyticsPnl());

    expect(result.current).toBe(false);
  });
});
