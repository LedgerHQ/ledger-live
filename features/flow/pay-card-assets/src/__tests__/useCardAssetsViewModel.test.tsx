import { act, renderHook } from "@testing-library/react";
import type { CardLinkedWalletBalance } from "@features/flow-pay-card-wallets";
import { CryptoOrTokenCurrencySchema } from "@domain/entity-currency";
import type { CardAssetsProps } from "../types";
import { I18nWrapper } from "./i18nWrapper";
import { formatCardAssetCryptoAmount, useCardAssetsViewModel } from "../useCardAssetsViewModel";

const mockUseIsCardSignedIn = jest.fn();
const mockUseCardLinkedWallets = jest.fn();
const mockUpdateCardWalletPriorities = jest.fn();
const mockUnwrapUpdate = jest.fn();

jest.mock("@domain/api-card-management", () => ({
  useUpdateCardWalletPrioritiesMutation: () => [
    mockUpdateCardWalletPriorities,
    { isLoading: false },
  ],
}));

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => mockUseIsCardSignedIn(),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (...args: unknown[]) => mockUseCardLinkedWallets(...args),
}));

jest.mock("@features/flow-pay-card-transactions", () => ({
  useCardTransactionsViewModel: () => ({ transactions: [] }),
}));

function stubWallets(
  overrides: Partial<{
    wallets: readonly Pick<
      CardLinkedWalletBalance,
      "id" | "addressId" | "balance" | "currency" | "network" | "ledgerId" | "ledgerCurrency"
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

function renderViewModel(overrides: Partial<CardAssetsProps> = {}) {
  return renderHook(
    () =>
      useCardAssetsViewModel({
        currencies: CURRENCIES,
        priceWallet,
        formatCountervalue,
        ...overrides,
      }),
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
    mockUpdateCardWalletPriorities.mockReturnValue({ unwrap: mockUnwrapUpdate });
    mockUnwrapUpdate.mockResolvedValue({ success: true });
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
    });
  });

  it("should report error when either wallets query fails", () => {
    stubWallets({ isError: true });

    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      status: "error",
    });
  });

  it("should report empty when the card has no linked wallets", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      status: "empty",
      rows: [],
    });
  });

  it("should name each wallet after its currency and price it through the host", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          addressId: "address-usdc",
          balance: "125.40",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
        { id: "w-usdt", balance: null, currency: "usdt", network: "ethereum" },
      ],
    });

    const { result } = renderViewModel();

    expect(result.current.status).toBe("ready");
    expect(result.current.rows).toEqual([
      {
        id: "w-usdc",
        addressId: "address-usdc",
        currency: "usdc",
        network: "ethereum",
        name: "USD Coin",
        ticker: "USDC",
        ledgerId: "ethereum/erc20/usd__coin",
        cryptoAmount: "125.40 USDC",
        countervalue: "$12540",
        countervalueAmount: 12540,
      },
      // Nothing maps this one and it has no balance, so the asset code stands in for the name and
      // the host's resolver is never asked.
      {
        id: "w-usdt",
        currency: "usdt",
        network: "ethereum",
        name: "USDT",
        ticker: "USDT",
        ledgerId: "",
        cryptoAmount: "USDT",
        countervalue: null,
        countervalueAmount: null,
      },
    ]);
    expect(priceWallet).toHaveBeenCalledWith(USDC, "125.40");
    expect(priceWallet).toHaveBeenCalledTimes(1);
  });

  it("should refresh the selected asset when its wallet balance changes", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          addressId: "address-usdc",
          balance: "125.40",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
      ],
    });
    const { result, rerender } = renderViewModel();

    act(() => result.current.onAssetPress(result.current.rows[0]));
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          balance: "250.80",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
      ],
    });
    rerender();

    expect(result.current.selectedAsset?.cryptoAmount).toBe("250.80 USDC");
  });

  it("should open the manage dialog when manage is pressed", () => {
    const { result } = renderViewModel();

    act(() => result.current.onManagePress());

    expect(result.current.dialogState).toBe("manage");
  });

  it("should send every linked wallet in its new order when an asset is reordered", async () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          addressId: "address-usdc",
          balance: "125.40",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
        {
          id: "w-usdt",
          addressId: "address-usdt",
          balance: "75",
          currency: "usdt",
          network: "ethereum",
        },
        {
          id: "w-btc",
          addressId: "address-btc",
          balance: "1",
          currency: "btc",
          network: "bitcoin",
        },
      ],
    });
    const { result } = renderViewModel();

    await act(() => result.current.onReorderAssets("w-btc", "w-usdc"));

    expect(result.current.rows.map(row => row.id)).toEqual(["w-btc", "w-usdc", "w-usdt"]);
    expect(mockUpdateCardWalletPriorities).toHaveBeenCalledWith({
      wallets: [
        { addressId: "address-btc", priority: 1 },
        { addressId: "address-usdc", priority: 2 },
        { addressId: "address-usdt", priority: 3 },
      ],
    });
  });

  it("should hand add asset through to the host", () => {
    const onAddAsset = jest.fn();
    const { result } = renderHook(
      () =>
        useCardAssetsViewModel({
          currencies: CURRENCIES,
          priceWallet,
          formatCountervalue,
          onAddAsset,
        }),
      { wrapper: I18nWrapper },
    );

    act(() => result.current.onAddAssetPress?.());

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it("should hand the selected asset to the host top up and close the dialog", () => {
    stubWallets({
      wallets: [
        {
          id: "w-usdc",
          balance: "125.40",
          currency: "usdc",
          network: "ethereum",
          ledgerId: "ethereum/erc20/usd__coin",
          ledgerCurrency: USDC,
        },
      ],
    });
    const onTopUp = jest.fn();

    const { result } = renderViewModel({ onTopUp });

    act(() => result.current.onAssetPress(result.current.rows[0]));
    expect(result.current.dialogState).toBe("details");

    act(() => result.current.onTopUpPress());

    expect(onTopUp).toHaveBeenCalledWith(expect.objectContaining({ currency: "usdc" }));
    expect(result.current.dialogState).toBe("closed");
  });

  it("should omit the add asset action when the host does not provide one", () => {
    const { result } = renderViewModel();

    expect(result.current.onAddAssetPress).toBeUndefined();
  });
});
