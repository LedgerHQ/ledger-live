import { renderHook } from "@testing-library/react";
import { I18nWrapper, CARD_ASSETS_COPY } from "./i18nWrapper";
import {
  formatCardAssetCryptoAmount,
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

function renderViewModel() {
  return renderHook(() => useCardAssetsViewModel(), { wrapper: I18nWrapper });
}

describe("formatCardAssetTicker", () => {
  it("should uppercase the currency", () => {
    expect(formatCardAssetTicker("usdc")).toBe("USDC");
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

  it("should map linked wallets to crypto-amount rows", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          balance: "125.40",
          currency: "usdc",
          ledgerId: "ethereum/erc20/usd_coin",
        },
        { id: "w-usdt", balance: null, currency: "usdt" },
      ],
    });

    const { result } = renderViewModel();

    expect(result.current.status).toBe("ready");
    expect(result.current.rows).toEqual([
      {
        id: "w-usdc",
        ticker: "USDC",
        cryptoAmount: "125.40 USDC",
        ledgerId: "ethereum/erc20/usd_coin",
      },
      { id: "w-usdt", ticker: "USDT", cryptoAmount: null },
    ]);
  });
});
