import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardNumbersView } from "./CardNumbersView.native";
import type { CardNumbersViewProps } from "../../types";

const IMAGE_URL = "https://card.test/details-image";

const props: CardNumbersViewProps = {
  status: "idle",
  imageUrl: undefined,
  onReveal: jest.fn(),
  onHide: jest.fn(),
  onImageError: jest.fn(),
};

describe("CardNumbersView (native)", () => {
  it("should hide the card numbers image until they are revealed", () => {
    render(<CardNumbersView {...props} cardFace={<></>} />, { wrapper: I18nWrapper });

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
  });

  it("should show the card numbers image when they are revealed", () => {
    render(<CardNumbersView {...props} status="revealed" imageUrl={IMAGE_URL} cardFace={<></>} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
  });
});
