import { renderHook } from "@tests/test-renderer";
import { usePortfolioBalanceSectionViewModel } from "../usePortfolioBalanceSectionViewModel";
import * as usePortfolioBalanceForDisplayModule from "LLM/hooks/usePortfolioBalanceForDisplay";

jest.mock("LLM/hooks/usePortfolioBalanceForDisplay");

const mockUsePortfolioBalanceForDisplay = jest.mocked(
  usePortfolioBalanceForDisplayModule.usePortfolioBalanceForDisplay,
);

const defaultDisplay = {
  displayedBalance: 1000,
  isLoading: false,
  isBalanceAvailable: true,
  countervalueChange: { percentage: 0, value: 0 },
  unit: { code: "USD", name: "USD", magnitude: 2 },
};

const defaultProps = { showAssets: true, isReadOnlyMode: false };

describe("usePortfolioBalanceSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceForDisplay.mockReturnValue(defaultDisplay);
  });

  it("returns noSigner when readOnly", () => {
    const { result } = renderHook(() =>
      usePortfolioBalanceSectionViewModel({ showAssets: false, isReadOnlyMode: true }),
    );
    expect(result.current.state).toBe("noSigner");
  });

  it("returns noAccounts when showAssets is false", () => {
    const { result } = renderHook(() =>
      usePortfolioBalanceSectionViewModel({ showAssets: false, isReadOnlyMode: false }),
    );
    expect(result.current.state).toBe("noAccounts");
  });

  it("reads balance and loading from the shared display slice", () => {
    const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));
    expect(result.current.balance).toBe(1000);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isBalanceAvailable).toBe(true);
  });
});
