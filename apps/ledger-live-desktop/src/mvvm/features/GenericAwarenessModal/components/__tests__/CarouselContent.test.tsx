import React from "react";
import { render, screen } from "tests/testSetup";
import useTheme from "~/renderer/hooks/useTheme";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";
import { advanceCarouselSlide } from "../../testUtils/modalTestUtils";
import CarouselContent, { type CarouselContentProps } from "../CarouselContent";
import { CAROUSEL_SLIDE_TEXT_LINE_LIMITS } from "../clampedText";

const slides: GenericAwarenessModalCarouselSlide[] = [
  {
    title: "First slide title",
    subtitle: "First slide subtitle",
    imageUrlLight: "https://example.com/a-light.png",
    imageUrlDark: "https://example.com/a-dark.png",
    primaryButtonLabel: "Primary A",
    primaryButtonLink: "https://www.ledger.com",
    navigationButtonLabel: "",
  },
  {
    title: "Second slide title",
    subtitle: "Second slide subtitle",
    imageUrlLight: "https://example.com/b-light.png",
    imageUrlDark: "https://example.com/b-dark.png",
    primaryButtonLabel: "Primary B",
    primaryButtonLink: "https://www.ledger.com/compare",
    navigationButtonLabel: "",
  },
];

const defaultProps: CarouselContentProps = {
  slides,
  onSlidePrimaryClick: jest.fn(),
  onSlideChange: jest.fn(),
  onContinueClick: jest.fn(),
  onClose: jest.fn(),
};

jest.mock("~/renderer/hooks/useTheme");

const mockUseTheme = jest.mocked(useTheme);

const renderCarousel = (props: Partial<CarouselContentProps> = {}) =>
  render(<CarouselContent {...defaultProps} {...props} />);

describe("CarouselContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({ theme: "light" } as ReturnType<typeof useTheme>);
  });

  it("should hide the primary button when label or link is empty", () => {
    renderCarousel({
      slides: [{ ...slides[0], primaryButtonLabel: "Primary A", primaryButtonLink: "" }],
    });

    expect(screen.queryByTestId("generic-awareness-modal-primary-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("generic-awareness-modal-continue-button")).toBeVisible();
  });

  it("should render a custom navigation button label when provided", () => {
    renderCarousel({
      slides: [{ ...slides[0], navigationButtonLabel: "Keep going" }],
    });

    expect(screen.getByTestId("generic-awareness-modal-continue-button")).toHaveTextContent(
      "Keep going",
    );
  });

  it("should render the first slide with line limits and primary label", () => {
    renderCarousel();

    expect(screen.getByText("First slide title").style.getPropertyValue("-webkit-line-clamp")).toBe(
      String(CAROUSEL_SLIDE_TEXT_LINE_LIMITS.title),
    );
    expect(
      screen.getByText("First slide subtitle").style.getPropertyValue("-webkit-line-clamp"),
    ).toBe(String(CAROUSEL_SLIDE_TEXT_LINE_LIMITS.subtitle));
    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toHaveTextContent(
      "Primary A",
    );
  });

  it.each([
    ["light", "https://example.com/a-light.png"],
    ["dark", "https://example.com/a-dark.png"],
  ] as const)(
    "should render the %s slide image when themed urls are provided",
    (theme, expectedSrc) => {
      mockUseTheme.mockReturnValue({ theme } as ReturnType<typeof useTheme>);
      renderCarousel();

      const image = screen.getByRole("presentation");
      expect(image).toBeVisible();
      expect(image).toHaveAttribute("src", expectedSrc);
      expect(image).toHaveAttribute("alt", "");
    },
  );

  it("should not render an image when themed urls are empty", () => {
    const slidesWithoutImage: GenericAwarenessModalCarouselSlide[] = [
      { ...slides[0], imageUrlLight: "", imageUrlDark: "" },
      slides[1],
    ];

    const { container } = renderCarousel({ slides: slidesWithoutImage });

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("First slide title")).toBeVisible();
  });

  it("should advance to the last slide and show Close", async () => {
    const { user } = renderCarousel();

    expect(screen.getByRole("button", { name: "Continue" })).toBeVisible();

    await advanceCarouselSlide(user, "First slide title");

    expect(screen.getByText("Second slide title")).toBeVisible();
    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toHaveTextContent(
      "Primary B",
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
  });

  it("should call onContinueClick and onSlideChange when advancing from the first slide", async () => {
    const onContinueClick = jest.fn();
    const onSlideChange = jest.fn();
    const { user } = renderCarousel({ onContinueClick, onSlideChange });

    await advanceCarouselSlide(user, "First slide title");

    expect(onContinueClick).toHaveBeenCalledWith(0, false);
    expect(onSlideChange).toHaveBeenCalledWith(1);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("should invoke onSlidePrimaryClick with the current slide", async () => {
    const onSlidePrimaryClick = jest.fn();
    const { user } = renderCarousel({ onSlidePrimaryClick });

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

    expect(onSlidePrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSlidePrimaryClick).toHaveBeenCalledWith(slides[0]);
  });

  it("should invoke onSlidePrimaryClick with the second slide after advancing", async () => {
    const onSlidePrimaryClick = jest.fn();
    const { user } = renderCarousel({ onSlidePrimaryClick });

    await advanceCarouselSlide(user, "First slide title");
    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

    expect(onSlidePrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSlidePrimaryClick).toHaveBeenCalledWith(slides[1]);
  });

  it("should call onContinueClick with last slide flag and onClose when Close is clicked", async () => {
    const onContinueClick = jest.fn();
    const onClose = jest.fn();
    const onSlidePrimaryClick = jest.fn();
    const { user } = renderCarousel({ onContinueClick, onClose, onSlidePrimaryClick });

    await advanceCarouselSlide(user, "First slide title");

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onContinueClick).toHaveBeenCalledWith(1, true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSlidePrimaryClick).not.toHaveBeenCalled();
  });

  it("should call onContinueClick and onClose when Continue is clicked on a single-slide carousel", async () => {
    const onContinueClick = jest.fn();
    const onClose = jest.fn();
    const { user } = renderCarousel({ slides: [slides[0]], onContinueClick, onClose });

    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();

    await user.click(screen.getByTestId("generic-awareness-modal-continue-button"));

    expect(onContinueClick).toHaveBeenCalledWith(0, true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
