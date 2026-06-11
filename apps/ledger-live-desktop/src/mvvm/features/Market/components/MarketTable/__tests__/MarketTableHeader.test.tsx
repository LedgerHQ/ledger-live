import React from "react";
import { screen } from "tests/testSetup";
import { MarketTableHeader } from "../MarketTableHeader";
import { mockT, renderInTable } from "../../__tests__/shared";

type HeaderProps = Parameters<typeof MarketTableHeader>[0];

function createProps(overrides: Partial<HeaderProps> = {}): HeaderProps {
  return {
    marketCapSort: "desc",
    changeSort: undefined,
    onToggleMarketCap: jest.fn(),
    onToggleChange: jest.fn(),
    t: mockT,
    ...overrides,
  };
}

const renderHeader = (props: HeaderProps) => renderInTable(<MarketTableHeader {...props} />);

describe("MarketTableHeader", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render the column headers", () => {
    renderHeader(createProps());

    expect(screen.getByText("market.marketTable.crypto")).toBeVisible();
    expect(screen.getByText("market.marketTable.price")).toBeVisible();
    expect(screen.getByText("market.marketTable.volume")).toBeVisible();
    expect(screen.getByText("market.marketTable.marketCap")).toBeVisible();
    expect(screen.getByText("market.marketTable.change")).toBeVisible();
  });

  it("should call onToggleMarketCap when the market cap sort button is clicked", async () => {
    const onToggleMarketCap = jest.fn();
    const { user } = renderHeader(createProps({ onToggleMarketCap }));

    await user.click(screen.getByTestId("market-sort-marketcap"));
    expect(onToggleMarketCap).toHaveBeenCalledTimes(1);
  });

  it("should call onToggleChange when the change sort button is clicked", async () => {
    const onToggleChange = jest.fn();
    const { user } = renderHeader(createProps({ onToggleChange }));

    await user.click(screen.getByTestId("market-sort-change"));
    expect(onToggleChange).toHaveBeenCalledTimes(1);
  });
});
