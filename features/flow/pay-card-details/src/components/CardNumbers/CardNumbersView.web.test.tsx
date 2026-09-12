import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardNumbersView } from "./CardNumbersView";
import type { CardNumbersViewProps } from "../../types";

const IMAGE_URL = "https://card.test/details-image";

function renderNumbers(props: Partial<CardNumbersViewProps> = {}) {
  return render(
    <CardNumbersView
      status="idle"
      imageUrl={undefined}
      onReveal={jest.fn()}
      onHide={jest.fn()}
      onImageError={jest.fn()}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );
}

describe("CardNumbersView (web)", () => {
  it("should show the card image when numbers are visible", () => {
    renderNumbers({ status: "revealed", imageUrl: IMAGE_URL });

    const image = screen.getByRole("img", { name: CARD_COPY.numbersImageAlt });
    expect(image).toHaveAttribute("src", IMAGE_URL);
    expect(image).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it("should flip the card to show numbers on the back", () => {
    renderNumbers({
      status: "revealed",
      imageUrl: IMAGE_URL,
      cardFace: <div data-testid="card-face">card face</div>,
    });

    expect(screen.getByTestId("card-numbers-flip")).toHaveClass("[transform:rotateY(180deg)]");
    expect(screen.getByTestId("card-face").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt })).toHaveAttribute(
      "src",
      IMAGE_URL,
    );
  });

  it("should hide the back from assistive tech before the card is flipped", () => {
    renderNumbers({
      cardFace: <div data-testid="card-face">card face</div>,
    });

    expect(screen.getByTestId("card-numbers-flip")).toHaveClass("[transform:rotateY(0deg)]");
    expect(screen.getByTestId("card-face").parentElement).toHaveAttribute("aria-hidden", "false");
    expect(screen.queryByRole("img", { name: CARD_COPY.numbersImageAlt })).not.toBeInTheDocument();
  });

  it("should report a failed load when the details image errors", () => {
    const onImageError = jest.fn();
    renderNumbers({ status: "revealed", imageUrl: IMAGE_URL, onImageError });

    fireEvent.error(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt }));

    expect(onImageError).toHaveBeenCalledTimes(1);
  });
});
