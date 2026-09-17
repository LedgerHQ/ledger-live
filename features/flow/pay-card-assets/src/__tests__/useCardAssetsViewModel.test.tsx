import { renderHook } from "@testing-library/react";
import { I18nWrapper, CARD_ASSETS_COPY } from "./i18nWrapper";
import type { FormatCardAssetCountervalue } from "../types";
import {
  formatCardAssetCryptoAmount,
  formatCardAssetFiatAmount,
  formatCardAssetName,
  formatCardAssetTicker,
  useCardAssetsViewModel,
} from "../useCardAssetsViewModel";

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
    wallets: readonly {
      id: string;
      balance: string | null;
      currency: string;
      counterValue: number | null;
      ledgerId?: string;
    }[];
    isLoading: boolean;
    isError: boolean;
  }> = {},
) {
  mockUseCardLinkedWallets.mockReturnValue({
    wallets: [],
    isLoading: false,
    isError: false,
    isFetching: false,
    total: 0,
    isPartialTotal: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

const formatCountervalue: FormatCardAssetCountervalue = value => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderViewModel(format?: FormatCardAssetCountervalue) {
  return renderHook(() => useCardAssetsViewModel({ formatCountervalue: format }), {
    wrapper: I18nWrapper,
  });
}

describe("formatCardAssetTicker", () => {
  it("should uppercase the currency", () => {
    expect(formatCardAssetTicker("usdc")).toBe("USDC");
  });
});

describe("formatCardAssetName", () => {
  it("should map known tickers to the catalog display name", () => {
    expect(formatCardAssetName("usdc")).toBe("USD Coin");
  });

  it("should fall back to the ticker when the currency is unknown", () => {
    expect(formatCardAssetName("xyz")).toBe("XYZ");
  });
});

describe("formatCardAssetFiatAmount", () => {
  it("should stringify a formatted preferred-currency value", () => {
    expect(formatCardAssetFiatAmount(125.4, formatCountervalue)).toBe("$125.00");
  });

  it("should return null when there is no countervalue or formatter", () => {
    expect(formatCardAssetFiatAmount(null, formatCountervalue)).toBeNull();
    expect(formatCardAssetFiatAmount(125.4)).toBeNull();
  });
});

describe("formatCardAssetCryptoAmount", () => {
  it("should pair a balance with an uppercased ticker", () => {
    expect(formatCardAssetCryptoAmount("125.40", "usdc")).toBe("125.40 USDC");
  });

  it("should return null when the balance is missing", () => {
    expect(formatCardAssetCryptoAmount(null, "usdt")).toBeNull();
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

  it("should fetch linked wallets once signed in", () => {
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

  it("should map linked wallets to name, ticker, fiat, and crypto rows", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          balance: "125.40",
          currency: "usdc",
          counterValue: 125.4,
          ledgerId: "ethereum/erc20/usd_coin",
        },
        { id: "w-btc", balance: "0.012", currency: "btc", counterValue: null },
      ],
    });

    const { result } = renderViewModel(formatCountervalue);

    expect(result.current.status).toBe("ready");
    expect(result.current.rows).toEqual([
      {
        id: "w-usdc",
        name: "USD Coin",
        ticker: "USDC",
        cryptoAmount: "125.40 USDC",
        fiatAmount: "$125.00",
        ledgerId: "ethereum/erc20/usd_coin",
      },
      {
        id: "w-btc",
        name: "Bitcoin",
        ticker: "BTC",
        cryptoAmount: "0.012 BTC",
        fiatAmount: null,
      },
    ]);
  });
});
