import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import { useMarketBannerRankingSelectViewModel } from "../components/MarketBannerRankingSelect/useMarketBannerRankingSelectViewModel";
import { selectMarketBannerRanking } from "~/renderer/reducers/marketBanner";

const EXPECTED_RANKINGS = ["trending", "gainers", "losers", "favorites"];
const EXPECTED_LABELS = ["Trending", "Gainers", "Losers", "Favorites"];

const renderRankingViewModel = (initialState?: Record<string, unknown>) =>
  renderHook(() => useMarketBannerRankingSelectViewModel(), {
    initialState,
  });

const getFavoritesOption = (
  options: ReturnType<typeof useMarketBannerRankingSelectViewModel>["options"],
) => options.find(option => option.value === "favorites");

describe("useMarketBannerRankingSelectViewModel", () => {
  it("exposes rankings in display order with translated labels", () => {
    const { result } = renderRankingViewModel();

    expect(result.current.options.map(option => option.value)).toEqual(EXPECTED_RANKINGS);
    expect(result.current.options.map(option => option.label)).toEqual(EXPECTED_LABELS);
  });

  it("defaults to trending when no persisted ranking exists", () => {
    const { result } = renderRankingViewModel();

    expect(result.current.value?.value).toBe("trending");
  });

  it("reflects the persisted ranking", () => {
    const { result } = renderRankingViewModel({ marketBanner: { ranking: "losers" } });

    expect(result.current.value?.value).toBe("losers");
  });

  it("disables Favorites only when there are no starred coins", () => {
    const { result: withoutStarred } = renderRankingViewModel({
      settings: { starredMarketCoins: [] },
    });
    expect(getFavoritesOption(withoutStarred.current.options)?.disabled).toBe(true);

    const { result: withStarred } = renderRankingViewModel({
      settings: { starredMarketCoins: ["bitcoin"] },
    });
    expect(getFavoritesOption(withStarred.current.options)?.disabled).toBe(false);
  });

  it("dispatches the selected ranking through onChange", () => {
    const { result, store } = renderRankingViewModel();

    act(() => {
      result.current.onChange({ value: "gainers", label: "Gainers" });
    });

    expect(selectMarketBannerRanking(store.getState())).toBe("gainers");
  });

  it("ignores a null selection", () => {
    const { result, store } = renderRankingViewModel({ marketBanner: { ranking: "losers" } });

    act(() => {
      result.current.onChange(null);
    });

    expect(selectMarketBannerRanking(store.getState())).toBe("losers");
  });
});
