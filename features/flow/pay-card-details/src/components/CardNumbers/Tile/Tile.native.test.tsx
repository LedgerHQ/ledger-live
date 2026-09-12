import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { CardNumbersTile } from "./Tile";
import type { CardNumbersViewProps } from "../../../types";

const IMAGE_URL = "https://card.test/details-image";

function renderTile(numbers: Partial<CardNumbersViewProps> = {}) {
  const onReveal = jest.fn();
  const onHide = jest.fn();

  return {
    onReveal,
    onHide,
    user: userEvent.setup(),
    ...render(
      <CardNumbersTile
        status="idle"
        imageUrl={undefined}
        onReveal={onReveal}
        onHide={onHide}
        {...numbers}
      />,
      { wrapper: I18nWrapper },
    ),
  };
}

describe("CardNumbersTile (native)", () => {
  it("should show View when nothing is open yet", () => {
    renderTile();

    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
  });

  it("should ask to show numbers when the user taps View", async () => {
    const { user, onReveal, onHide } = renderTile();

    await user.press(screen.getByText(CARD_COPY.numbersReveal));

    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onHide).not.toHaveBeenCalled();
  });

  it("should show Hide when numbers are visible", () => {
    renderTile({ status: "revealed", imageUrl: IMAGE_URL });

    expect(screen.getByText(CARD_COPY.numbersHide)).toBeVisible();
  });

  it("should hide the image when the user taps Hide", async () => {
    const { user, onHide, onReveal } = renderTile({ status: "revealed", imageUrl: IMAGE_URL });

    await user.press(screen.getByText(CARD_COPY.numbersHide));

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it("should show an error when loading fails", () => {
    renderTile({ status: "failed" });

    expect(screen.getByText(CARD_COPY.numbersFailed)).toBeVisible();
  });
});
