import { renderHook } from "@tests/test-renderer";
import { useReceiveNoahEntry } from "../useNoahEntryPoint";
import { State } from "~/reducers/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("useReceiveNoahEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns showNoahMenu as false when the feature flag is disabled", () => {
    const { result } = renderHook(() => useReceiveNoahEntry({}), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: { noah: { enabled: false } },
        },
      }),
    });

    expect(result.current.showNoahMenu).toBe(false);
  });

  it("returns showNoahMenu as false when the route makes shouldShowNoahMenu return false", () => {
    const { result } = renderHook(
      () =>
        useReceiveNoahEntry({
          currency: { id: "bitcoin", family: "bitcoin" } as CryptoCurrency,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              noah: { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } },
            },
          },
        }),
      },
    );

    expect(result.current.showNoahMenu).toBe(false);
  });
  it("returns showNoahMenu as true when the feature flag is enabled and the currency is part of the active currency IDs", () => {
    const { result } = renderHook(
      () =>
        useReceiveNoahEntry({
          currency: {
            type: "TokenCurrency",
            id: "ethereum/erc20/usd__coin",
            parentCurrency: { family: "evm" },
          } as unknown as TokenCurrency,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              noah: { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } },
            },
          },
        }),
      },
    );
    expect(result.current.showNoahMenu).toBe(true);
  });
});
