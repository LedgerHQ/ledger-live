import { renderHook } from "@tests/test-renderer";
import type { BalanceData } from "@features/flow-pay-card-balance";
import { track } from "~/analytics";
import { usePayTabViewModel } from "./usePayTabViewModel";

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 24 }),
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const balance: BalanceData = {
  status: "ready",
  stableBalance: 0,
  filter: "all",
  hasBalance: false,
  filterOptions: [],
  formatCountervalue: jest.fn(),
  onConfirmFilter: jest.fn(),
};

jest.mock("LLM/features/PayTab/hooks/usePayCardBalance", () => ({
  usePayCardBalance: () => balance,
}));

const mockDepositOpen = jest.fn();
const mockDepositOptions = {
  isOpen: false,
  page: "Pay",
  labels: { title: "Add stablecoins", options: {} },
  onClose: jest.fn(),
  onSelect: jest.fn(),
};

jest.mock("LLM/features/PayTab/hooks/usePayStablecoins", () => ({
  usePayStablecoins: () => ({
    stablecoins: [],
    defaultStablecoins: [{ id: "ethereum/erc20/usd__coin" }],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("LLM/features/PayTab/hooks/usePayTabDepositOptions", () => ({
  usePayTabDepositOptions: () => ({
    open: mockDepositOpen,
    depositOptions: mockDepositOptions,
  }),
}));

const mockedTrack = jest.mocked(track);

describe("usePayTabViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the navigation bar offset", () => {
    const { result } = renderHook(() => usePayTabViewModel());

    expect(result.current.top).toBe(24);
  });

  it("should expose the balance data and empty-state labels for the hero", () => {
    const { result } = renderHook(() => usePayTabViewModel());

    expect(result.current.balance).toBe(balance);
    expect(result.current.balanceLabels.emptyTitle).toBeTruthy();
    expect(result.current.balanceLabels.emptyDescription).toBeTruthy();
  });

  it("should build the feature tour content with the three feature rows", () => {
    const { result } = renderHook(() => usePayTabViewModel());
    const { featureTour } = result.current;

    expect(featureTour.title).toBeTruthy();
    expect(featureTour.description).toBeTruthy();
    expect(featureTour.ctaLabel).toBeTruthy();
    expect(featureTour.rows.map(row => row.icon)).toEqual(["Globe", "Chart5", "CreditCard"]);
    featureTour.rows.forEach(row => {
      expect(row.title).toBeTruthy();
      expect(row.description).toBeTruthy();
    });
  });

  it("should expose the deposit options and wire the deposit tile to open them", () => {
    const { result } = renderHook(() => usePayTabViewModel());

    expect(result.current.depositOptions).toBe(mockDepositOptions);

    const depositTile = result.current.actionTiles.tiles.find(tile => tile.id === "deposit");
    depositTile?.onPress();
    expect(mockDepositOpen).toHaveBeenCalledTimes(1);
  });

  it("should wire the tour analytics callbacks to track", () => {
    const { result } = renderHook(() => usePayTabViewModel());
    const { featureTour } = result.current;

    featureTour.onTrackScreen?.("Page card feature intro");
    expect(mockedTrack).toHaveBeenCalledWith("Page card feature intro");

    featureTour.onTrackEvent?.("button_clicked", { button: "got it" });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "got it" });
  });
});
