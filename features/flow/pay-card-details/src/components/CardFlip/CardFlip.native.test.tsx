import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardFlip } from "./CardFlip.native";
import type { CardFlipProps } from "../../types";

const IMAGE_URL = "https://card.test/details-image";

const reveal: NonNullable<CardFlipProps["reveal"]> = {
  isRevealed: false,
  imageUrl: undefined,
  onImageLoad: jest.fn(),
  onImageError: jest.fn(),
};

describe("CardFlip (native)", () => {
  it("should hide the card numbers image until they are revealed", () => {
    render(<CardFlip reveal={reveal} cardFace={<></>} />, { wrapper: I18nWrapper });

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
  });

  it("should show the card numbers image when they are revealed", () => {
    render(
      <CardFlip reveal={{ ...reveal, isRevealed: true, imageUrl: IMAGE_URL }} cardFace={<></>} />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
  });
});
