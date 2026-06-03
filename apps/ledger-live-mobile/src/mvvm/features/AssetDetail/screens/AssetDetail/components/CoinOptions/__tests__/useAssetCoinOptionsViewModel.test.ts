import { act, renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import { useAssetCoinOptionsViewModel } from "../useAssetCoinOptionsViewModel";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotifications: () => ({ tryTriggerPushNotificationDrawerAfterAction: jest.fn() }),
}));

jest.mock("~/analytics", () => ({ track: jest.fn() }));

const bitcoin = getCryptoCurrencyById("bitcoin");

function renderViewModel({
  blacklistedTokenIds = [],
  starredMarketCoins = [],
  marketId,
}: {
  blacklistedTokenIds?: string[];
  starredMarketCoins?: string[];
  marketId?: string;
} = {}) {
  return renderHook(
    () => useAssetCoinOptionsViewModel({ currency: bitcoin, currencyId: bitcoin.id, marketId }),
    {
      overrideInitialState: (state: State): State => ({
        ...state,
        settings: { ...state.settings, blacklistedTokenIds, starredMarketCoins },
      }),
    },
  );
}

describe("useAssetCoinOptionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists the favourite state and tracks analytics in both directions", () => {
    const { result, store } = renderViewModel();

    act(() => result.current.onToggleFavourite());
    expect(store.getState().settings.starredMarketCoins).toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "favourite",
        is_favourite: true,
      }),
    );

    act(() => result.current.onToggleFavourite());
    expect(store.getState().settings.starredMarketCoins).not.toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "favourite",
        is_favourite: false,
      }),
    );
  });

  it("prefers marketId over currencyId as the star key so favourites stay aligned with the Market list", () => {
    const { result, store } = renderViewModel({ marketId: "bitcoin-coingecko-id" });

    act(() => result.current.onToggleFavourite());

    const { starredMarketCoins } = store.getState().settings;
    expect(starredMarketCoins).toContain("bitcoin-coingecko-id");
    expect(starredMarketCoins).not.toContain(bitcoin.id);
  });

  it("persists the hidden state and tracks analytics in both directions", () => {
    const { result, store } = renderViewModel();

    act(() => result.current.onToggleHideFromPortfolio());
    expect(store.getState().settings.blacklistedTokenIds).toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "hide_asset",
        is_hidden: true,
      }),
    );

    act(() => result.current.onToggleHideFromPortfolio());
    expect(store.getState().settings.blacklistedTokenIds).not.toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "hide_asset",
        is_hidden: false,
      }),
    );
  });
});
