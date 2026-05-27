import { renderHook } from "@tests/test-renderer";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import { overrideStateWithFunds } from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const USDC_CURRENCY_ID = "ethereum/erc20/usd__coin";

const mockBitcoin = getCryptoCurrencyById("bitcoin");

const mockUsdc = {
  type: "TokenCurrency",
  id: USDC_CURRENCY_ID,
  parentCurrency: { family: "evm" },
} as unknown as TokenCurrency;

const withOpenDrawer =
  (noahEnabled: boolean, activeCurrencyIds: string[] = []) =>
  (state: State): State => {
    const base = overrideStateWithFunds(state);
    return {
      ...base,
      featureFlags: {
        ...base.featureFlags,
        overrides: {
          ...base.featureFlags.overrides,
          noah: {
            enabled: noahEnabled,
            params: { activeCurrencyIds },
          },
        },
      },
      transferDrawer: {
        isOpen: true,
        sourceScreenName: "Asset Detail",
      },
    };
  };

describe("TransferDrawer bank_transfer visibility", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should hide bank_transfer for a non-stablecoin asset when Noah is enabled", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockBitcoin }), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeUndefined();
  });

  it("should show bank_transfer for a stablecoin when Noah is enabled and currency is in activeCurrencyIds", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockUsdc }), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeDefined();
  });

  it("should hide bank_transfer when Noah flag is disabled regardless of currency", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockUsdc }), {
      overrideInitialState: withOpenDrawer(false),
    });

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeUndefined();
  });

  it("should show bank_transfer when no currency is provided (Portfolio context) and Noah is enabled", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeDefined();
  });
});
