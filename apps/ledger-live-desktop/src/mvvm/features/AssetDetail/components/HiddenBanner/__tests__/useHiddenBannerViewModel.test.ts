import { renderHook, act } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/renderer/analytics/segment";
import { useHiddenBannerViewModel } from "../useHiddenBannerViewModel";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const btc = getCryptoCurrencyById("bitcoin");

const createInitialState = (overrides = {}) => ({
  settings: {
    counterValue: "USD",
    blacklistedTokenIds: [],
    ...overrides,
  },
});
const renderViewModel = (currency: CryptoOrTokenCurrency, settings = {}) =>
  renderHook(() => useHiddenBannerViewModel({ currency }), {
    initialState: createInitialState(settings),
  });

describe("useHiddenBannerViewModel", () => {
  it("reports the asset as not hidden when blacklistedTokenIds is empty", () => {
    const { result } = renderViewModel(btc);

    expect(result.current.isHidden).toBe(false);
  });

  it("reports a coin as hidden when its currency.id is blacklisted", () => {
    const { result } = renderViewModel(btc, { blacklistedTokenIds: ["bitcoin"] });

    expect(result.current.isHidden).toBe(true);
  });

  it("reports a token as hidden when its currency.id is blacklisted", () => {
    const { result } = renderViewModel(usdcToken, { blacklistedTokenIds: [usdcToken.id] });

    expect(result.current.isHidden).toBe(true);
  });

  it("dispatches showToken and tracks analytics when onShowAsset is invoked", () => {
    const { result, store } = renderViewModel(btc, { blacklistedTokenIds: ["bitcoin"] });

    act(() => result.current.onShowAsset());

    expect(store.getState().settings.blacklistedTokenIds).not.toContain("bitcoin");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "show_in_portfolio",
      currency: "bitcoin",
      page: "Asset detail",
    });
  });

  it("exposes localized banner copy", () => {
    const { result } = renderViewModel(btc);

    expect(result.current.description).toBe("This asset is hidden from your portfolio.");
    expect(result.current.primaryActionLabel).toBe("Show asset");
  });
});
