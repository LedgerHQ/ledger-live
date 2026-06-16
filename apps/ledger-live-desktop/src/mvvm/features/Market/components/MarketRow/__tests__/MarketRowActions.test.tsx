import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketRowActions, MarketRowActionsProps } from "../MarketRowActions";
import { mockT } from "../../__tests__/shared";

const mockOnSwap = jest.fn();
const mockOnBuySell = jest.fn();
const mockOnStake = jest.fn();
const mockOnFavouriteSelect = jest.fn();
const mockOnMenuOpenChange = jest.fn();

function createProps(overrides: Partial<MarketRowActionsProps> = {}): MarketRowActionsProps {
  return {
    ticker: "BTC",
    swapAction: { available: true, onClick: mockOnSwap },
    buySellAction: { available: true, onClick: mockOnBuySell },
    earnAction: { available: true, onClick: mockOnStake, label: "Earn" },
    isStarred: false,
    onFavouriteSelect: mockOnFavouriteSelect,
    onMenuOpenChange: mockOnMenuOpenChange,
    t: mockT,
    ...overrides,
  };
}

describe("MarketRowActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the swap button when swap is available", () => {
    render(<MarketRowActions {...createProps()} />);
    expect(screen.getByTestId("market-BTC-swap-button")).toBeVisible();
  });

  it("should hide the swap button when swap is unavailable", () => {
    render(
      <MarketRowActions
        {...createProps({ swapAction: { available: false, onClick: mockOnSwap } })}
      />,
    );
    expect(screen.queryByTestId("market-BTC-swap-button")).toBeNull();
  });

  it("should call swap onClick when the swap button is pressed", async () => {
    const { user } = render(<MarketRowActions {...createProps()} />);
    await user.click(screen.getByTestId("market-BTC-swap-button"));
    expect(mockOnSwap).toHaveBeenCalledTimes(1);
  });

  it("should render the actions menu trigger", () => {
    render(<MarketRowActions {...createProps()} />);
    expect(screen.getByTestId("market-BTC-actions-menu")).toBeVisible();
  });

  it("should show buy/sell, earn and favourite items when the menu is opened", async () => {
    const { user } = render(<MarketRowActions {...createProps()} />);

    await user.click(screen.getByTestId("market-BTC-actions-menu"));

    expect(await screen.findByText("market.marketTable.menu.buySell")).toBeVisible();
    expect(screen.getByText("Earn")).toBeVisible();
    expect(screen.getByText("market.marketTable.menu.addToFavourites")).toBeVisible();
  });

  it("should hide the buy/sell item when buy/sell is unavailable", async () => {
    const { user } = render(
      <MarketRowActions
        {...createProps({ buySellAction: { available: false, onClick: mockOnBuySell } })}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    expect(screen.queryByText("market.marketTable.menu.buySell")).toBeNull();
  });

  it("should hide the earn item when earn is unavailable", async () => {
    const { user } = render(
      <MarketRowActions
        {...createProps({ earnAction: { available: false, onClick: mockOnStake, label: "Earn" } })}
      />,
    );

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    expect(screen.queryByText("Earn")).toBeNull();
  });

  it("should show the remove-from-favourites label when starred", async () => {
    const { user } = render(<MarketRowActions {...createProps({ isStarred: true })} />);

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    expect(await screen.findByText("market.marketTable.menu.removeFromFavourites")).toBeVisible();
    expect(screen.queryByText("market.marketTable.menu.addToFavourites")).toBeNull();
  });

  it("should call buySell onClick when the buy/sell item is selected", async () => {
    const { user } = render(<MarketRowActions {...createProps()} />);

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    await user.click(await screen.findByText("market.marketTable.menu.buySell"));
    expect(mockOnBuySell).toHaveBeenCalledTimes(1);
  });

  it("should call earn onClick when the earn item is selected", async () => {
    const { user } = render(<MarketRowActions {...createProps()} />);

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    await user.click(await screen.findByText("Earn"));
    expect(mockOnStake).toHaveBeenCalledTimes(1);
  });

  it("should call onFavouriteSelect when the favourite item is selected", async () => {
    const { user } = render(<MarketRowActions {...createProps()} />);

    await user.click(screen.getByTestId("market-BTC-actions-menu"));
    await user.click(await screen.findByText("market.marketTable.menu.addToFavourites"));
    expect(mockOnFavouriteSelect).toHaveBeenCalledTimes(1);
  });
});
