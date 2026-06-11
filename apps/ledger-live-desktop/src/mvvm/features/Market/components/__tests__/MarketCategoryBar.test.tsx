import React from "react";
import type { TFunction } from "i18next";
import { render, screen, fireEvent } from "tests/testSetup";
import type { MarketCategories } from "../../hooks/useMarketCategories";
import { MarketCategoryBar } from "../MarketCategoryBar";

const t = ((key: string) => key) as unknown as TFunction;

const buildCategories = (overrides: Partial<MarketCategories> = {}): MarketCategories => ({
  selectedCategory: "all",
  tabs: [
    { value: "all", labelKey: "market.assets.categories.all" },
    { value: "stocks", labelKey: "market.assets.categories.stocks" },
    { value: "starred", labelKey: "market.assets.categories.favorites" },
  ],
  onSelectCategory: jest.fn(),
  ...overrides,
});

describe("MarketCategoryBar", () => {
  it("renders one segmented button per tab", () => {
    render(<MarketCategoryBar categories={buildCategories()} t={t} />);

    expect(screen.getByTestId("market-category-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("market-category-switcher-all")).toBeInTheDocument();
    expect(screen.getByTestId("market-category-switcher-stocks")).toBeInTheDocument();
    expect(screen.getByTestId("market-category-switcher-starred")).toBeInTheDocument();
  });

  it("calls onSelectCategory when a tab is pressed", () => {
    const onSelectCategory = jest.fn();
    render(<MarketCategoryBar categories={buildCategories({ onSelectCategory })} t={t} />);

    fireEvent.click(screen.getByTestId("market-category-switcher-stocks"));

    expect(onSelectCategory).toHaveBeenCalledWith("stocks");
  });

  it("renders a trending tab's raw label as-is (no translation)", () => {
    const categories = buildCategories({
      tabs: [
        { value: "all", labelKey: "market.assets.categories.all" },
        { value: "infrastructure", label: "Infrastructure" },
      ],
    });
    render(<MarketCategoryBar categories={categories} t={t} />);

    const trendingTab = screen.getByTestId("market-category-switcher-infrastructure");
    expect(trendingTab).toHaveTextContent("Infrastructure");
  });
});
