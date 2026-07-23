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
  currencyId = bitcoin.id,
  marketId,
}: {
  blacklistedTokenIds?: string[];
  starredMarketCoins?: string[];
  currencyId?: string;
  marketId?: string;
} = {}) {
  return renderHook(
    () => useAssetCoinOptionsViewModel({ currency: bitcoin, currencyId, marketId }),
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

  it("allows toggling favourites when currency is not resolved yet", () => {
    const { result, store } = renderHook(
      () =>
        useAssetCoinOptionsViewModel({
          currency: undefined,
          currencyId: "ethereum/erc20/shiba_inu",
          marketId: "shiba-inu",
        }),
      {
        overrideInitialState: (state: State): State => ({
          ...state,
          settings: { ...state.settings, starredMarketCoins: [] },
        }),
      },
    );

    act(() => result.current.onToggleFavourite());

    expect(store.getState().settings.starredMarketCoins).toContain("shiba-inu");
  });

  it("persists DAI's market id instead of the DAI V2 Ledger token id", () => {
    const daiV2Id = "ethereum/erc20/dai_stablecoin_v2_0";
    const { result, store } = renderViewModel({ currencyId: daiV2Id, marketId: "dai" });

    act(() => result.current.onToggleFavourite());

    const { starredMarketCoins } = store.getState().settings;
    expect(starredMarketCoins).toContain("dai");
    expect(starredMarketCoins).not.toContain(daiV2Id);
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
