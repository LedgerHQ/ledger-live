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
}: {
  blacklistedTokenIds?: string[];
  starredMarketCoins?: string[];
} = {}) {
  return renderHook(
    () => useAssetCoinOptionsViewModel({ currency: bitcoin, currencyId: bitcoin.id }),
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
        button: "asset_coin_options_favourite",
        is_favourite: true,
      }),
    );

    act(() => result.current.onToggleFavourite());
    expect(store.getState().settings.starredMarketCoins).not.toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "asset_coin_options_favourite",
        is_favourite: false,
      }),
    );
  });

  it("persists the hidden state and tracks analytics in both directions", () => {
    const { result, store } = renderViewModel();

    act(() => result.current.onToggleHideFromPortfolio());
    expect(store.getState().settings.blacklistedTokenIds).toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "asset_coin_options_hide_portfolio",
        is_hidden: true,
      }),
    );

    act(() => result.current.onToggleHideFromPortfolio());
    expect(store.getState().settings.blacklistedTokenIds).not.toContain(bitcoin.id);
    expect(track).toHaveBeenLastCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "asset_coin_options_hide_portfolio",
        is_hidden: false,
      }),
    );
  });
});
