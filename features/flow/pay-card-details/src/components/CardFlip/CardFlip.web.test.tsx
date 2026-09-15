import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardFlip } from "./CardFlip";
import type { CardFlipProps } from "../../types";

const IMAGE_URL = "https://card.test/details-image";
const FACE = "card face";

function renderFlip(reveal: CardFlipProps["reveal"]) {
  return render(<CardFlip reveal={reveal} cardFace={FACE} />, { wrapper: I18nWrapper });
}

describe("CardFlip (web)", () => {
  it("should show the card face when there is nothing to flip", () => {
    renderFlip(null);

    expect(screen.getByText(FACE)).toBeVisible();
    expect(screen.queryByTestId("card-flip")).not.toBeInTheDocument();
  });

  it("should show the numbers image when the card face is flipped", () => {
    renderFlip({
      isRevealed: true,
      imageUrl: IMAGE_URL,
      onImageError: jest.fn(),
    });

    const image = screen.getByRole("img", { name: CARD_COPY.numbersImageAlt });
    expect(image).toBeVisible();
    expect(image).toHaveAttribute("src", IMAGE_URL);
    expect(image).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it("should show the card face and not the numbers image before reveal", () => {
    renderFlip({
      isRevealed: false,
      imageUrl: undefined,
      onImageError: jest.fn(),
    });

    expect(screen.getByText(FACE)).toBeVisible();
    expect(screen.queryByRole("img", { name: CARD_COPY.numbersImageAlt })).not.toBeInTheDocument();
  });

  it("should keep the numbers painted on the hidden face, so the flip back is not empty", () => {
    renderFlip({
      isRevealed: false,
      imageUrl: IMAGE_URL,
      onImageError: jest.fn(),
    });

    expect(
      screen.getByRole("img", { name: CARD_COPY.numbersImageAlt, hidden: true }),
    ).toBeInTheDocument();
  });

  it("should report a failed load when the details image errors", () => {
    const onImageError = jest.fn();
    renderFlip({ isRevealed: true, imageUrl: IMAGE_URL, onImageError });

    fireEvent.error(screen.getByRole("img", { name: CARD_COPY.numbersImageAlt }));

    expect(onImageError).toHaveBeenCalledTimes(1);
  });
});
