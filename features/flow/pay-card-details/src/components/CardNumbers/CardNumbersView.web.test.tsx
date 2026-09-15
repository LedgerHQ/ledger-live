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

  it("should show the numbers image when the card face is flipped", () => {
    renderNumbers({
      status: "revealed",
      imageUrl: IMAGE_URL,
      cardFace: <div>card face</div>,
    });

    expect(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt })).toBeVisible();
  });

  it("should show the card face and not the numbers image before reveal", () => {
    renderNumbers({
      cardFace: <div>card face</div>,
    });

    expect(screen.getByText("card face")).toBeVisible();
    expect(screen.queryByRole("img", { name: CARD_COPY.numbersImageAlt })).not.toBeInTheDocument();
  });

  it("should report a failed load when the details image errors", () => {
    const onImageError = jest.fn();
    renderNumbers({ status: "revealed", imageUrl: IMAGE_URL, onImageError });

    fireEvent.error(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt }));

    expect(onImageError).toHaveBeenCalledTimes(1);
  });
});
