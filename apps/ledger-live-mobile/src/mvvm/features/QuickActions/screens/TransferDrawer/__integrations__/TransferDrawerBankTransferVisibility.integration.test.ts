import { renderHook, waitFor } from "@tests/test-renderer";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import {
  createMockAccount,
  mockBitcoinCurrency,
  mockEthereumCurrency,
  overrideStateWithFunds,
} from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

const USDC_CURRENCY_ID = "ethereum/erc20/usd__coin";

const mockBitcoin = getCryptoCurrencyById("bitcoin");

const mockUsdc = {
  type: "TokenCurrency",
  id: USDC_CURRENCY_ID,
  parentCurrencyId: "ethereum",
} as unknown as TokenCurrency;

const withOpenDrawer =
  (noahEnabled: boolean, activeCurrencyIds: string[] = [], currency?: CryptoOrTokenCurrency) =>
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
        scope: currency ? { type: "asset", currency } : { type: "wallet" },
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
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID], mockBitcoin),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeUndefined();
  });

  it("should show bank_transfer for a stablecoin when Noah is enabled and currency is in activeCurrencyIds", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withOpenDrawer(true, [USDC_CURRENCY_ID], mockUsdc),
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current.actions.find(a => a.id === "bank_transfer")).toBeDefined();
  });

  it("should hide bank_transfer when Noah flag is disabled regardless of currency", async () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withOpenDrawer(false, [], mockUsdc),
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
