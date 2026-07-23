import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import { render, screen } from "@tests/test-renderer";
import type { GenericAwarenessModalCarouselSlide } from "@ledgerhq/live-common/genericAwarenessModal";
import { CarouselFooterButton } from "../CarouselFooterButton";

const slides: GenericAwarenessModalCarouselSlide[] = [
  {
    title: "First slide",
    subtitle: "First slide subtitle",
    imageUrlLight: "https://example.com/a.png",
    imageUrlDark: "",
    primaryButtonLabel: "Learn more",
    primaryButtonLink: "https://www.ledger.com",
    navigationButtonLabel: "",
  },
  {
    title: "Second slide",
    subtitle: "Second slide subtitle",
    imageUrlLight: "https://example.com/b.png",
    imageUrlDark: "",
    primaryButtonLabel: "",
    primaryButtonLink: "",
    navigationButtonLabel: "",
  },
];

const renderCarouselFooterButton = (
  slideOverrides?: Partial<GenericAwarenessModalCarouselSlide>,
  slideIndex = 0,
) => {
  const nextSlides = slides.map((slide, index) =>
    index === slideIndex ? { ...slide, ...slideOverrides } : slide,
  );

  return render(
    <Slides initialSlideIndex={slideIndex}>
      <Slides.Footer>
        <CarouselFooterButton
          slides={nextSlides}
          onClose={jest.fn()}
          onNavigationPress={jest.fn()}
          onPrimaryPress={jest.fn()}
          onMalformedUrl={jest.fn()}
        />
      </Slides.Footer>
    </Slides>,
  );
};

describe("CarouselFooterButton", () => {
  it("should render the primary button when label and link are provided", () => {
    renderCarouselFooterButton();

    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toBeOnTheScreen();
    expect(screen.getByText("Learn more")).toBeOnTheScreen();
  });

  it.each([
    { primaryButtonLabel: "", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "   ", primaryButtonLink: "https://www.ledger.com" },
  ] as const)("should hide the primary button when label is empty", patch => {
    renderCarouselFooterButton(patch);

    expect(screen.queryByTestId("generic-awareness-modal-primary-button")).not.toBeOnTheScreen();
  });

  it.each([
    { primaryButtonLabel: "Learn more", primaryButtonLink: "" },
    { primaryButtonLabel: "Learn more", primaryButtonLink: "   " },
  ] as const)("should show the primary button when label is present and link is empty", patch => {
    renderCarouselFooterButton(patch);

    expect(screen.getByTestId("generic-awareness-modal-primary-button")).toBeOnTheScreen();
  });

  it("should hide the primary button on slides without action data", () => {
    renderCarouselFooterButton(undefined, 1);

    expect(screen.queryByTestId("generic-awareness-modal-primary-button")).not.toBeOnTheScreen();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });
});
