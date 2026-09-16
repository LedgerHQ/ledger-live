import { renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencySchema, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardLinkedWalletBalance } from "@features/flow-pay-card-wallets";
import type { CardAssetsProps } from "../types";

const mockUseCardLinkedWallets = jest.fn();

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (...args: unknown[]) => mockUseCardLinkedWallets(...args),
}));

import { useCardPricedWallets } from "../useCardPricedWallets";

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

const CURRENCIES = new Map([
  [USDC.id, USDC],
  [BITCOIN.id, BITCOIN],
]);

// Whole dollars, so a sum is easy to read: 12.50 USDC is 1250 and 1 BTC is 100_000.
const priceWallet = jest.fn((currency: CryptoOrTokenCurrency): number | null =>
  currency.id === USDC.id ? 1250 : 100_000,
);

const assets: CardAssetsProps = {
  currencies: CURRENCIES,
  priceWallet,
  formatCountervalue: String,
};

function stubWallets(
  wallets: readonly Pick<
    CardLinkedWalletBalance,
    "id" | "balance" | "currency" | "ledgerId" | "ledgerCurrency"
  >[],
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

const usdcWallet = {
  id: "w-usdc",
  balance: "12.50",
  currency: "usdc",
  ledgerId: USDC.id,
  ledgerCurrency: USDC,
};

const bitcoinWallet = {
  id: "w-btc",
  balance: "1",
  currency: "btc",
  ledgerId: BITCOIN.id,
  ledgerCurrency: BITCOIN,
};

describe("useCardPricedWallets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubWallets([]);
  });

  it("should total what every wallet is worth", () => {
    stubWallets([usdcWallet, bitcoinWallet]);

    const { result } = renderHook(() => useCardPricedWallets(assets, true));

    expect(result.current.total).toBe(101_250);
    expect(result.current.wallets.map(wallet => wallet.countervalue)).toEqual([1250, 100_000]);
  });

  it("should leave a wallet nothing could price out of the total, rather than guessing at it", () => {
    priceWallet.mockReturnValueOnce(null);
    stubWallets([usdcWallet, bitcoinWallet]);

    const { result } = renderHook(() => useCardPricedWallets(assets, true));

    expect(result.current.total).toBe(100_000);
    expect(result.current.wallets[0]?.countervalue).toBeNull();
  });

  it("should not price a wallet no Ledger currency maps", () => {
    stubWallets([{ id: "w-usdt", balance: "10", currency: "usdt" }]);

    const { result } = renderHook(() => useCardPricedWallets(assets, true));

    expect(result.current.total).toBe(0);
    expect(priceWallet).not.toHaveBeenCalled();
    expect(result.current.wallets[0]).toMatchObject({ name: "USDT", ticker: "USDT", ledgerId: "" });
  });

  it("should total nothing while the card has no wallets", () => {
    const { result } = renderHook(() => useCardPricedWallets(assets, true));

    expect(result.current.total).toBe(0);
  });

  it("should skip the wallets query while nobody is signed in", () => {
    renderHook(() => useCardPricedWallets(assets, false));

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should skip the wallets query for a host that does not list them", () => {
    renderHook(() => useCardPricedWallets(undefined, true));

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should report the query's own loading and error states", () => {
    stubWallets([], { isLoading: true, isError: true });

    const { result } = renderHook(() => useCardPricedWallets(assets, true));

    expect(result.current).toMatchObject({ isLoading: true, isError: true });
  });
});
