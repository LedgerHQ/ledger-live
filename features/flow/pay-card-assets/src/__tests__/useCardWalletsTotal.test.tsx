import { renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencySchema, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardLinkedWalletBalance } from "@features/flow-pay-card-wallets";
import type { CardAssetsProps } from "../types";

const mockUseCardLinkedWallets = jest.fn();

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (...args: unknown[]) => mockUseCardLinkedWallets(...args),
}));

import { useCardWalletsTotal } from "../useCardWalletsTotal";

const USDC = CryptoOrTokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0x0000000000000000000000000000000000000000",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});

const BITCOIN = CryptoOrTokenCurrencySchema.parse({
  type: "CryptoCurrency",
  id: "bitcoin",
  coinType: 0,
  name: "Bitcoin",
  managerAppName: "Bitcoin",
  ticker: "BTC",
  scheme: "bitcoin",
  color: "#ffae35",
  family: "bitcoin",
  units: [{ name: "bitcoin", code: "BTC", magnitude: 8 }],
  explorerViews: [],
});

// Whole cents, so a sum reads at a glance: 12.50 USDC is 1250 and one BTC is 100_000.
const priceWallet = jest.fn((currency: CryptoOrTokenCurrency): number | null =>
  currency.id === USDC.id ? 1250 : 100_000,
);

const assets: CardAssetsProps = {
  currencies: new Map([
    [USDC.id, USDC],
    [BITCOIN.id, BITCOIN],
  ]),
  priceWallet,
  formatCountervalue: String,
};

function stubWallets(
  wallets: readonly Pick<CardLinkedWalletBalance, "id" | "balance" | "ledgerCurrency">[],
  overrides: Partial<{ isLoading: boolean; isError: boolean }> = {},
) {
  mockUseCardLinkedWallets.mockReturnValue({
    wallets,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

describe("useCardWalletsTotal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubWallets([]);
  });

  it("should total what every wallet is worth", () => {
    stubWallets([
      { id: "w-usdc", balance: "12.50", ledgerCurrency: USDC },
      { id: "w-btc", balance: "1", ledgerCurrency: BITCOIN },
    ]);

    const { result } = renderHook(() => useCardWalletsTotal(assets, true));

    expect(result.current.total).toBe(101_250);
  });

  it("should leave a wallet nothing could price out of the total, rather than guessing at it", () => {
    priceWallet.mockReturnValueOnce(null);
    stubWallets([
      { id: "w-usdc", balance: "12.50", ledgerCurrency: USDC },
      { id: "w-btc", balance: "1", ledgerCurrency: BITCOIN },
    ]);

    const { result } = renderHook(() => useCardWalletsTotal(assets, true));

    expect(result.current.total).toBe(100_000);
  });

  it("should not price a wallet no Ledger currency maps, nor one with no balance read", () => {
    stubWallets([
      { id: "w-usdt", balance: "10" },
      { id: "w-btc", balance: null, ledgerCurrency: BITCOIN },
    ]);

    const { result } = renderHook(() => useCardWalletsTotal(assets, true));

    expect(result.current.total).toBe(0);
    expect(priceWallet).not.toHaveBeenCalled();
  });

  it("should skip the wallets query while nobody is signed in", () => {
    renderHook(() => useCardWalletsTotal(assets, false));

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should skip the wallets query for a host that lists no assets", () => {
    renderHook(() => useCardWalletsTotal(undefined, true));

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should report the query's own loading and error states", () => {
    stubWallets([], { isLoading: true, isError: true });

    const { result } = renderHook(() => useCardWalletsTotal(assets, true));

    expect(result.current).toMatchObject({ isLoading: true, isError: true });
  });
});
