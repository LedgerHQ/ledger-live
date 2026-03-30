import { renderHook, act } from "tests/testSetup";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useRowItemViewModel } from "../useRowItemViewModel";
import { useMarketActions } from "LLD/features/Market/hooks/useMarketActions";

const mockNavigate = jest.fn();
const mockOnBuy = jest.fn();
const mockOnSwap = jest.fn();
const mockOnStake = jest.fn();
const mockOnSell = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/Market/hooks/useMarketActions", () => ({
  Page: { Market: "Page Market", MarketCoin: "Page Market Coin" },
  useMarketActions: jest.fn(() => ({
    onBuy: mockOnBuy,
    onSwap: mockOnSwap,
    onStake: mockOnStake,
    availableOnBuy: false,
    availableOnSwap: false,
    availableOnStake: false,
  })),
}));

jest.mock("~/renderer/hooks/useGetStakeLabelLocaleBased", () => ({
  useGetStakeLabelLocaleBased: () => "Earn",
}));

const mockedUseMarketActions = jest.mocked(useMarketActions);

const bitcoinCurrency = MOCK_MARKET_CURRENCY_DATA[0];

const allActionsAvailable = {
  onBuy: mockOnBuy,
  onSwap: mockOnSwap,
  onStake: mockOnStake,
  onSell: mockOnSell,
  availableOnBuy: true,
  availableOnSwap: true,
  availableOnStake: true,
  availableOnSell: true,
};

describe("useRowItemViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMarketActions.mockReturnValue(allActionsAvailable);
  });

  it("returns empty actions when currency has no ledgerIds", () => {
    const currencyNoLedgerIds = { ...bitcoinCurrency, ledgerIds: [] };

    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: currencyNoLedgerIds,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.actions).toEqual([]);
    expect(result.current.hasActions).toBe(false);
  });

  it("returns empty actions when currency is null", () => {
    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: null,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.actions).toEqual([]);
    expect(result.current.hasActions).toBe(false);
  });

  it("returns hasActions=false when all availableOn flags are false", () => {
    mockedUseMarketActions.mockReturnValue({
      onBuy: mockOnBuy,
      onSwap: mockOnSwap,
      onStake: mockOnStake,
      onSell: mockOnSell,
      availableOnBuy: false,
      availableOnSwap: false,
      availableOnStake: false,
      availableOnSell: false,
    });

    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.actions).toEqual([]);
    expect(result.current.hasActions).toBe(false);
  });

  it("returns only available actions when currency has ledgerIds", () => {
    mockedUseMarketActions.mockReturnValue({
      ...allActionsAvailable,
      availableOnSell: false,
      availableOnStake: false,
    });

    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.actions).toHaveLength(2);
    expect(result.current.actions.map(a => a.type)).toEqual(["buy", "swap"]);
    expect(result.current.hasActions).toBe(true);
  });

  it("returns all 4 actions when all are available", () => {
    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.actions).toHaveLength(4);
    expect(result.current.actions.map(a => a.type)).toEqual(["buy", "sell", "swap", "stake"]);
    expect(result.current.actions[0].onClick).toBe(mockOnBuy);
    expect(result.current.actions[1].onClick).toBe(mockOnSell);
    expect(result.current.actions[2].onClick).toBe(mockOnSwap);
    expect(result.current.actions[3].onClick).toBe(mockOnStake);
    expect(result.current.actions[3].label).toBe("Earn");
  });

  it("returns correct currentPriceChangePercentage based on range", () => {
    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    expect(result.current.currentPriceChangePercentage).toBe(
      bitcoinCurrency.priceChangePercentage[KeysPriceChange.day],
    );
  });

  it("onCurrencyClick navigates to the correct route", () => {
    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    act(() => {
      result.current.onCurrencyClick();
    });

    expect(mockNavigate).toHaveBeenCalledWith(`/market/${bitcoinCurrency.id}`, {
      state: bitcoinCurrency,
    });
  });

  it("does not navigate when currency is null", () => {
    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: null,
        toggleStar: jest.fn(),
        range: "24h",
      }),
    );

    act(() => {
      result.current.onCurrencyClick();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("onStarClick calls toggleStar and prevents propagation", () => {
    const mockToggleStar = jest.fn();

    const { result } = renderHook(() =>
      useRowItemViewModel({
        currency: bitcoinCurrency,
        toggleStar: mockToggleStar,
        range: "24h",
      }),
    );

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent<HTMLDivElement>;

    act(() => {
      result.current.onStarClick(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockToggleStar).toHaveBeenCalled();
  });
});
