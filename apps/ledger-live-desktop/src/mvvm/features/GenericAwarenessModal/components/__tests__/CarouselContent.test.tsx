import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";
import CarouselContent from "../CarouselContent";

const slides: GenericAwarenessModalCarouselSlide[] = [
  {
    title: "First slide title",
    subtitle: "First slide subtitle",
    imageUrl: "https://example.com/a.png",
    primaryButtonLabel: "Primary A",
    primaryButtonLink: "https://www.ledger.com",
  },
  {
    title: "Second slide title",
    subtitle: "Second slide subtitle",
    imageUrl: "https://example.com/b.png",
    primaryButtonLabel: "Primary B",
    primaryButtonLink: "https://www.ledger.com",
  },
];

describe("CarouselContent", () => {
  it("should render the first slide copy and primary label", () => {
    const onSlidePrimaryClick = jest.fn();
    render(<CarouselContent slides={slides} onSlidePrimaryClick={onSlidePrimaryClick} />);

    expect(screen.getByText("First slide title")).toBeVisible();
    expect(screen.getByText("First slide subtitle")).toBeVisible();
    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toHaveTextContent(
      "Primary A",
    );
  });

  it("should advance visible slide after Continue and slide-out animation start", async () => {
    const onSlidePrimaryClick = jest.fn();
    const { user } = render(
      <CarouselContent slides={slides} onSlidePrimaryClick={onSlidePrimaryClick} />,
    );

    await user.click(screen.getByTestId("generic-awareness-modal-continue-button"));

    const slideOutAnimationStart = new Event("animationstart", { bubbles: true });
    Object.defineProperty(slideOutAnimationStart, "animationName", {
      value: "slide-out-to-left",
    });
    fireEvent(screen.getByText("First slide title"), slideOutAnimationStart);

    expect(screen.getByText("Second slide title")).toBeVisible();
    expect(screen.getByText("Second slide subtitle")).toBeVisible();
    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toHaveTextContent(
      "Primary B",
    );
  });

  it("should invoke onSlidePrimaryClick with the current slide", async () => {
    const onSlidePrimaryClick = jest.fn();
    const { user } = render(
      <CarouselContent slides={slides} onSlidePrimaryClick={onSlidePrimaryClick} />,
    );

    await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

    expect(onSlidePrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSlidePrimaryClick).toHaveBeenCalledWith(slides[0]);
  });

  it("should return to the first slide when Go to first slide is clicked on the last slide", async () => {
    const onSlidePrimaryClick = jest.fn();
    const { user } = render(
      <CarouselContent slides={slides} onSlidePrimaryClick={onSlidePrimaryClick} />,
    );

    await user.click(screen.getByTestId("generic-awareness-modal-continue-button"));

    const slideOutAnimationStart = new Event("animationstart", { bubbles: true });
    Object.defineProperty(slideOutAnimationStart, "animationName", {
      value: "slide-out-to-left",
    });
    fireEvent(screen.getByText("First slide title"), slideOutAnimationStart);

    expect(screen.getByText("Second slide title")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Go to first slide" }));

    const slideOutRight = new Event("animationstart", { bubbles: true });
    Object.defineProperty(slideOutRight, "animationName", {
      value: "slide-out-to-right",
    });
    fireEvent(screen.getByText("Second slide title"), slideOutRight);

    expect(screen.getByText("First slide title")).toBeVisible();
    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toHaveTextContent(
      "Primary A",
    );
  });
});
