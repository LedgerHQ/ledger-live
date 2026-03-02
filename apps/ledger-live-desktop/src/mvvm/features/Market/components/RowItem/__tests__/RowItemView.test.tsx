import React from "react";
import { render, screen } from "tests/testSetup";
import { RowItemView } from "../RowItemView";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { MarketAction, RowItemViewProps } from "../types";

const mockCurrency = MOCK_MARKET_CURRENCY_DATA[0];

const mockOnBuy = jest.fn();
const mockOnSwap = jest.fn();
const mockOnStake = jest.fn();

const buyAction: MarketAction = { type: "buy", label: "Buy", onClick: mockOnBuy };
const swapAction: MarketAction = { type: "swap", label: "Swap", onClick: mockOnSwap };
const stakeAction: MarketAction = { type: "stake", label: "Earn", onClick: mockOnStake };

function createDefaultProps(overrides: Partial<RowItemViewProps> = {}): RowItemViewProps {
  return {
    style: {},
    currency: mockCurrency,
    counterCurrency: "usd",
    locale: "en",
    isStarred: false,
    hasActions: false,
    actions: [],
    currentPriceChangePercentage: 2.5,
    onCurrencyClick: jest.fn(),
    onStarClick: jest.fn(),
    ...overrides,
  };
}

describe("RowItemView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render currency name and ticker", () => {
    render(<RowItemView {...createDefaultProps()} />);

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });

  it("should render marketcap rank", () => {
    render(<RowItemView {...createDefaultProps()} />);

    expect(screen.getByText("1")).toBeVisible();
  });

  it("should render row when marketcapRank is present", () => {
    render(<RowItemView {...createDefaultProps()} />);

    const row = screen.getByTestId("market-BTC-row");
    expect(row).toBeVisible();
  });

  it("should render CryptoIcon when ledgerIds has entries", () => {
    render(<RowItemView {...createDefaultProps()} />);

    expect(screen.queryByAltText("currency logo")).toBeNull();
  });

  it("should render img fallback when ledgerIds is empty", () => {
    const currency = { ...mockCurrency, ledgerIds: [] };
    render(<RowItemView {...createDefaultProps({ currency })} />);

    expect(screen.getByAltText("currency logo")).toBeVisible();
  });

  it("should show Buy/Swap/Stake buttons when hasActions and all available", () => {
    render(
      <RowItemView
        {...createDefaultProps({
          hasActions: true,
          actions: [buyAction, swapAction, stakeAction],
        })}
      />,
    );

    expect(screen.getByTestId("market-BTC-buy-button")).toBeVisible();
    expect(screen.getByTestId("market-BTC-swap-button")).toBeVisible();
    expect(screen.getByTestId("market-BTC-stake-button")).toBeVisible();
  });

  it("should hide action buttons when hasActions is false", () => {
    render(<RowItemView {...createDefaultProps({ hasActions: false, actions: [] })} />);

    expect(screen.queryByTestId("market-BTC-buy-button")).toBeNull();
    expect(screen.queryByTestId("market-BTC-swap-button")).toBeNull();
    expect(screen.queryByTestId("market-BTC-stake-button")).toBeNull();
  });

  it("should show only Buy button when only buy action is provided", () => {
    render(
      <RowItemView
        {...createDefaultProps({
          hasActions: true,
          actions: [buyAction],
        })}
      />,
    );

    expect(screen.getByTestId("market-BTC-buy-button")).toBeVisible();
    expect(screen.queryByTestId("market-BTC-swap-button")).toBeNull();
    expect(screen.queryByTestId("market-BTC-stake-button")).toBeNull();
  });

  it("should render '-' when currentPriceChangePercentage is undefined", () => {
    render(<RowItemView {...createDefaultProps({ currentPriceChangePercentage: undefined })} />);

    const priceChangeCell = screen.getByTestId("market-price-change");
    expect(priceChangeCell).toHaveTextContent("-");
  });

  it("should render FormattedVal when currentPriceChangePercentage is defined", () => {
    render(<RowItemView {...createDefaultProps({ currentPriceChangePercentage: 5.5 })} />);

    const priceChangeCell = screen.getByTestId("market-price-change");
    expect(priceChangeCell).not.toHaveTextContent("-");
  });

  it("should render star button when isStarred is true", () => {
    render(<RowItemView {...createDefaultProps({ isStarred: true })} />);

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should render star button when isStarred is false", () => {
    render(<RowItemView {...createDefaultProps({ isStarred: false })} />);

    expect(screen.getByTestId("market-BTC-star-button")).toBeVisible();
  });

  it("should call onCurrencyClick on row click", async () => {
    const onCurrencyClick = jest.fn();
    const { user } = render(<RowItemView {...createDefaultProps({ onCurrencyClick })} />);

    await user.click(screen.getByTestId("market-BTC-row"));
    expect(onCurrencyClick).toHaveBeenCalledTimes(1);
  });

  it("should call onStarClick on star button click", async () => {
    const onStarClick = jest.fn();
    const { user } = render(<RowItemView {...createDefaultProps({ onStarClick })} />);

    await user.click(screen.getByTestId("market-BTC-star-button"));
    expect(onStarClick).toHaveBeenCalledTimes(1);
  });

  it("should call action onClick when Buy button is clicked", async () => {
    const { user } = render(
      <RowItemView
        {...createDefaultProps({
          hasActions: true,
          actions: [buyAction],
        })}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-buy-button"));
    expect(mockOnBuy).toHaveBeenCalledTimes(1);
  });

  it("should call action onClick when Swap button is clicked", async () => {
    const { user } = render(
      <RowItemView
        {...createDefaultProps({
          hasActions: true,
          actions: [swapAction],
        })}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-swap-button"));
    expect(mockOnSwap).toHaveBeenCalledTimes(1);
  });

  it("should call action onClick when Stake button is clicked", async () => {
    const { user } = render(
      <RowItemView
        {...createDefaultProps({
          hasActions: true,
          actions: [stakeAction],
        })}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-stake-button"));
    expect(mockOnStake).toHaveBeenCalledTimes(1);
  });

  it("should render sparkline chart when sparklineIn7d exists", async () => {
    const currency = {
      ...mockCurrency,
      sparklineIn7d: { path: "M0 0L1 1", viewBox: "0 0 100 50", isPositive: true },
    };
    const { user } = render(<RowItemView {...createDefaultProps({ currency })} />);

    await user.hover(screen.getByTestId("market-small-graph"));

    const graphCell = screen.getByTestId("market-small-graph");
    expect(graphCell.querySelector("svg")).toBeVisible();
  });

  it("should not render sparkline chart when sparklineIn7d is undefined", () => {
    const currency = { ...mockCurrency, sparklineIn7d: undefined };
    render(<RowItemView {...createDefaultProps({ currency })} />);

    const graphCell = screen.getByTestId("market-small-graph");
    expect(graphCell.querySelector("svg")).toBeNull();
  });
});
