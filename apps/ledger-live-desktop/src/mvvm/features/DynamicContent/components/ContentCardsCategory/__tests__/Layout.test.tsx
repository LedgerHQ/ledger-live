import React from "react";
import { render, screen } from "tests/testSetup";
import {
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
  type CategoryContentCard,
} from "~/types/dynamicContent";
import Layout from "../Layout";
import type { MappedCategorySlide } from "../useContentCardsCategoryViewModel";

jest.mock("../../LogContentCardWrapper", () => ({
  __esModule: true,
  default: ({
    additionalProps,
    location,
    children,
  }: {
    additionalProps?: { type?: string; layout?: string };
    location?: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="log-content-card-wrapper"
      data-type={additionalProps?.type}
      data-layout={additionalProps?.layout}
      data-location={location}
    >
      {children}
    </div>
  ),
}));

jest.mock("../CategoryCarousel", () => ({
  __esModule: true,
  default: ({ slides }: { slides: React.ReactNode[] }) => (
    <div data-testid="category-carousel">{slides}</div>
  ),
}));

const CATEGORY: CategoryContentCard = {
  id: "category-1",
  categoryId: "alwayson",
  title: "Discover our devices",
  description: "",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  isDismissable: true,
};

const SLIDES: MappedCategorySlide[] = [
  {
    displayedPosition: 0,
    card: {
      id: "child-1",
      title: "Ledger Flex",
      media: "https://example.com/flex.png",
      location: LocationContentCard.Portfolio,
      created: null,
      extras: {
        type: ContentCardsType.smallSquare,
        categoryId: "alwayson",
      },
    },
  },
];

describe("ContentCardsCategory Layout", () => {
  it("passes carousel type and layout for impressions", () => {
    render(
      <Layout
        category={CATEGORY}
        slides={SLIDES}
        isDismissable
        onCardClick={jest.fn()}
        onCardDismiss={jest.fn()}
      />,
    );

    const wrapper = screen.getByTestId("log-content-card-wrapper");
    expect(wrapper).toHaveAttribute("data-type", ContentCardsType.smallSquare);
    expect(wrapper).toHaveAttribute("data-layout", ContentCardsLayout.carousel);
    expect(wrapper).toHaveAttribute("data-location", LocationContentCard.Portfolio);
  });
});
