import { renderHook } from "@testing-library/react";
import type { CardLinkedWalletBalance } from "@features/flow-pay-card-wallets";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";
import { I18nWrapper, CARD_ASSETS_COPY } from "./i18nWrapper";
import { formatCardAssetCryptoAmount, useCardAssetsViewModel } from "../useCardAssetsViewModel";

const mockUseIsCardSignedIn = jest.fn();
const mockUseCardLinkedWallets = jest.fn();

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => mockUseIsCardSignedIn(),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (...args: unknown[]) => mockUseCardLinkedWallets(...args),
}));

function stubWallets(
  overrides: Partial<{
    wallets: readonly Pick<
      CardLinkedWalletBalance,
      "id" | "balance" | "currency" | "ledgerId" | "ledgerCurrency"
    >[];
    isLoading: boolean;
    isError: boolean;
  }> = {},
) {
  mockUseCardLinkedWallets.mockReturnValue({
    wallets: [],
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

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
const CURRENCIES = new Map([["ethereum/erc20/usd__coin", USDC]]);
const priceWallet = jest.fn(() => 12540);
const formatCountervalue = jest.fn((value: number) => `$${value}`);

function renderViewModel() {
  return renderHook(
    () => useCardAssetsViewModel({ currencies: CURRENCIES, priceWallet, formatCountervalue }),
    { wrapper: I18nWrapper },
  );
}

describe("formatCardAssetCryptoAmount", () => {
  it("should pair a balance with an uppercased ticker", () => {
    expect(formatCardAssetCryptoAmount("125.40", "usdc")).toBe("125.40 USDC");
  });

  it("should keep the ticker when the balance is missing", () => {
    expect(formatCardAssetCryptoAmount(null, "usdt")).toBe("USDT");
  });
});

describe("useCardAssetsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsCardSignedIn.mockReturnValue(true);
    stubWallets();
  });

  it("should hide the section and skip the wallets query while signed out", () => {
    mockUseIsCardSignedIn.mockReturnValue(false);

    const { result } = renderViewModel();

    expect(result.current.isVisible).toBe(false);
    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should fetch wallets once signed in", () => {
    renderViewModel();

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: false }));
  });

  it("should report loading while the first wallets read is in flight", () => {
    stubWallets({ isLoading: true });

    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      isVisible: true,
      status: "loading",
      title: CARD_ASSETS_COPY.title,
    });
  });

  it("should report error when either wallets query fails", () => {
    stubWallets({ isError: true });

    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      status: "error",
      errorLabel: CARD_ASSETS_COPY.error,
    });
  });

  it("should report empty when the card has no linked wallets", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      status: "empty",
      rows: [],
      emptyLabel: CARD_ASSETS_COPY.empty,
    });
  });

  it("should name each wallet after its currency and price it through the host", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          balance: "125.40",
          currency: "usdc",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
        { id: "w-usdt", balance: null, currency: "usdt" },
      ],
    });

    const { result } = renderViewModel();

    expect(result.current.status).toBe("ready");
    expect(result.current.rows).toEqual([
      {
        id: "w-usdc",
        name: "USD Coin",
        ticker: "USDC",
        ledgerId: "ethereum/erc20/usd__coin",
        cryptoAmount: "125.40 USDC",
        countervalue: "$12540",
      },
      // Nothing maps this one and it has no balance, so the asset code stands in for the name and
      // the host's resolver is never asked.
      {
        id: "w-usdt",
        name: "USDT",
        ticker: "USDT",
        ledgerId: "",
        cryptoAmount: "USDT",
        countervalue: null,
      },
    ]);
    expect(priceWallet).toHaveBeenCalledWith(USDC, "125.40");
    expect(priceWallet).toHaveBeenCalledTimes(1);
  });
});
