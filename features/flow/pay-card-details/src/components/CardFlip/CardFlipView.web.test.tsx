import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardFlipView } from "./CardFlipView";
import type { CardFlipViewProps } from "../../types";

const IMAGE_URL = "https://card.test/details-image";

function renderFlip(props: Partial<CardFlipViewProps> = {}) {
  return render(
    <CardFlipView
      status="idle"
      isRevealed={false}
      imageUrl={undefined}
      onReveal={jest.fn()}
      onHide={jest.fn()}
      onImageError={jest.fn()}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );
}

describe("CardFlipView (web)", () => {
  it("should show the card image when numbers are visible", () => {
    renderFlip({ status: "revealed", isRevealed: true, imageUrl: IMAGE_URL });

    const image = screen.getByRole("img", { name: CARD_COPY.numbersImageAlt });
    expect(image).toHaveAttribute("src", IMAGE_URL);
    expect(image).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it("should show the numbers image when the card face is flipped", () => {
    renderFlip({
      status: "revealed",
      isRevealed: true,
      imageUrl: IMAGE_URL,
      cardFace: <div>card face</div>,
    });

    expect(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt })).toBeVisible();
  });

  it("should show the card face and not the numbers image before reveal", () => {
    renderFlip({
      cardFace: <div>card face</div>,
    });

    expect(screen.getByText("card face")).toBeVisible();
    expect(screen.queryByRole("img", { name: CARD_COPY.numbersImageAlt })).not.toBeInTheDocument();
  });

  it("should keep the numbers painted on the hidden face, so the flip back is not empty", () => {
    renderFlip({
      status: "idle",
      isRevealed: false,
      imageUrl: IMAGE_URL,
      cardFace: "card face",
    });

    expect(
      screen.getByRole("img", { name: CARD_COPY.numbersImageAlt, hidden: true }),
    ).toBeInTheDocument();
  });

  it("should report a failed load when the details image errors", () => {
    const onImageError = jest.fn();
    renderFlip({ status: "revealed", isRevealed: true, imageUrl: IMAGE_URL, onImageError });

    fireEvent.error(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt }));

    expect(onImageError).toHaveBeenCalledTimes(1);
  });
});
