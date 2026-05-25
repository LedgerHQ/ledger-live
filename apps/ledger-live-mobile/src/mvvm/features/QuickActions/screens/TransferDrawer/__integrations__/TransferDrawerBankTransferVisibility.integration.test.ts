import { renderHook, waitFor } from "@tests/test-renderer";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import {
  createMockAccount,
  mockBitcoinCurrency,
  mockEthereumCurrency,
  overrideStateWithFunds,
} from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";

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
  // Pre-warm async coin-module bridges for the funded mock state (btc + eth) so the first
  // render of useAccountBridgeMany doesn't suspend (renderHook has no Suspense boundary).
  // Mock accounts route through mockBridgePromiseCache, populated by getAccountBridge.
  beforeAll(async () => {
    await Promise.all([
      getAccountBridge(createMockAccount(mockBitcoinCurrency, "btc-1")),
      getAccountBridge(createMockAccount(mockEthereumCurrency, "eth-1")),
    ]);
  });

  beforeEach(() => jest.clearAllMocks());

  it("should hide bank_transfer for a non-stablecoin asset when Noah is enabled", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockBitcoin }), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeUndefined();
  });

  it("should show bank_transfer for a stablecoin when Noah is enabled and currency is in activeCurrencyIds", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockUsdc }), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeDefined();
  });

  it("should hide bank_transfer when Noah flag is disabled regardless of currency", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel({ currency: mockUsdc }), {
      overrideInitialState: withOpenDrawer(false),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeUndefined();
  });

  it("should show bank_transfer when no currency is provided (Portfolio context) and Noah is enabled", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID]),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeDefined();
  });
});
