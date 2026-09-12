import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
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

function renderNumbers(overrides: Partial<CardNumbersViewProps> = {}) {
  return render(
    <CardNumbersView {...props} cardFace={<View testID="card-face" />} {...overrides} />,
    { wrapper: I18nWrapper },
  );
}

describe("CardNumbersView (native)", () => {
  it("should show the card face before numbers are revealed", () => {
    renderNumbers();

    expect(screen.getByTestId("card-numbers")).toBeVisible();
    expect(screen.getByTestId("card-face")).toBeVisible();
    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
  });

  it("should show the details image when numbers are visible", () => {
    renderNumbers({ status: "revealed", imageUrl: IMAGE_URL });

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toHaveProp("source", {
      uri: IMAGE_URL,
      cache: "reload",
    });
    expect(screen.queryByTestId("card-face")).not.toBeOnTheScreen();
  });

  it("should report a failed load when the details image errors", () => {
    const onImageError = jest.fn();
    renderNumbers({ status: "revealed", imageUrl: IMAGE_URL, onImageError });

    fireEvent(screen.getByLabelText(CARD_COPY.numbersImageAlt), "error");

    expect(onImageError).toHaveBeenCalledTimes(1);
  });
});
