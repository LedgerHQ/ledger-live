import React from "react";
import { render, screen } from "tests/testSetup";
import { HorizontalScroll } from "..";
import { useHorizontalScroll } from "../hooks/useHorizontalScroll";

jest.mock("../hooks/useHorizontalScroll");

const mockScrollLeft = jest.fn();
const mockScrollRight = jest.fn();
const mockUseHorizontalScroll = useHorizontalScroll as jest.Mock;

const defaultScrollState = {
  scrollContainerRef: { current: null },
  isAtStart: true,
  isAtEnd: false,
  scrollLeft: mockScrollLeft,
  scrollRight: mockScrollRight,
};

describe("HorizontalScroll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHorizontalScroll.mockReturnValue(defaultScrollState);
  });

  it("should render children and forward testids", () => {
    render(
      <HorizontalScroll data-testid="carousel" scrollContainerTestId="scroll-container">
        <div data-testid="child">content</div>
      </HorizontalScroll>,
    );

    expect(screen.getByTestId("carousel")).toBeVisible();
    expect(screen.getByTestId("scroll-container")).toBeVisible();
    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should hide the left edge and show the right edge at start", () => {
    render(
      <HorizontalScroll>
        <div>content</div>
      </HorizontalScroll>,
    );

    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("should show both edges when scrolled in the middle", () => {
    mockUseHorizontalScroll.mockReturnValue({
      ...defaultScrollState,
      isAtStart: false,
      isAtEnd: false,
    });

    render(
      <HorizontalScroll>
        <div>content</div>
      </HorizontalScroll>,
    );

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("should hide the right edge when at the end", () => {
    mockUseHorizontalScroll.mockReturnValue({
      ...defaultScrollState,
      isAtStart: false,
      isAtEnd: true,
    });

    render(
      <HorizontalScroll>
        <div>content</div>
      </HorizontalScroll>,
    );

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });

  it("should call scroll handlers when edges are clicked", async () => {
    mockUseHorizontalScroll.mockReturnValue({
      ...defaultScrollState,
      isAtStart: false,
      isAtEnd: false,
    });

    const { user } = render(
      <HorizontalScroll>
        <div>content</div>
      </HorizontalScroll>,
    );

    await user.click(screen.getByLabelText("Scroll left"));
    expect(mockScrollLeft).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Scroll right"));
    expect(mockScrollRight).toHaveBeenCalledTimes(1);
  });
});
