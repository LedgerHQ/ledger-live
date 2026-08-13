import { Linking } from "react-native";
import { renderHook } from "@tests/test-renderer";
import type { PayCardBalanceData } from "@features/flow-pay-card-balance";
import { track } from "~/analytics";
import { usePayTabViewModel } from "./usePayTabViewModel";

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 24 }),
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const balance: PayCardBalanceData = {
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

  it("should open the hosted login URL", async () => {
    const { result } = renderHook(() => usePayTabViewModel());

    await result.current.openHostedLogin("https://card.example.com/login");

    expect(Linking.openURL).toHaveBeenCalledWith("https://card.example.com/login");
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

  it("should wire the tour analytics callbacks to track", () => {
    const { result } = renderHook(() => usePayTabViewModel());
    const { featureTour } = result.current;

    featureTour.onTrackScreen?.("Page card feature intro");
    expect(mockedTrack).toHaveBeenCalledWith("Page card feature intro");

    featureTour.onTrackEvent?.("button_clicked", { button: "got it" });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "got it" });
  });
});
