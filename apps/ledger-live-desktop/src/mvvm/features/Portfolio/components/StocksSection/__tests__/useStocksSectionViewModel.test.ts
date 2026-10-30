import { act, renderHook } from "tests/testSetup";
import { useStocksSectionViewModel } from "../useStocksSectionViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

describe("useStocksSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to asset detail with market state when a stock is selected", () => {
    const { result } = renderHook(() => useStocksSectionViewModel());

    act(() => {
      result.current.navigateToAsset("spacex-xstock", {
        id: "spacex-xstock",
        ledgerIds: ["solana/spl/spacex"],
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/asset/spacex-xstock", {
      state: { id: "spacex-xstock", ledgerIds: ["solana/spl/spacex"] },
    });
  });
});
