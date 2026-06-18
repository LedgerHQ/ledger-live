import { act, renderHook, withFlagOverrides } from "tests/testSetup";
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
    const { result } = renderHook(() => useStocksSectionViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: { aggregatedAssets: true } },
      }),
    });

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

  it("navigates to market detail when aggregated assets is disabled", () => {
    const { result } = renderHook(() => useStocksSectionViewModel(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: { aggregatedAssets: false } },
      }),
    });

    act(() => {
      result.current.navigateToAsset("spacex-xstock", {
        id: "spacex-xstock",
        ledgerIds: ["solana/spl/spacex"],
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/market/spacex-xstock", {
      state: { id: "spacex-xstock", ledgerIds: ["solana/spl/spacex"] },
    });
  });
});
