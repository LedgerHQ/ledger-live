import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { RevealTile } from "./RevealTile";
import type { CardNumbersViewProps } from "../../../types";

function renderTile(cardNumbersViewModel: Partial<CardNumbersViewProps> = {}) {
  const onReveal = jest.fn();
  const onHide = jest.fn();

  return {
    onReveal,
    onHide,
    ...render(
      <RevealTile
        status="idle"
        isRevealed={false}
        onReveal={onReveal}
        onHide={onHide}
        {...cardNumbersViewModel}
      />,
      { wrapper: I18nWrapper },
    ),
  };
}

describe("RevealTile (web)", () => {
  it("should show View when nothing is open yet", () => {
    renderTile();

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeVisible();
  });

  it("should ask to show numbers when the user clicks View", async () => {
    const { onReveal, onHide } = renderTile();

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.numbersReveal }));

    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onHide).not.toHaveBeenCalled();
  });

  it("should lock View while loading", () => {
    renderTile({ status: "loading" });

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeDisabled();
  });

  it("should show Hide when numbers are visible", () => {
    renderTile({ isRevealed: true });

    expect(screen.getByRole("button", { name: CARD_COPY.numbersHide })).toBeVisible();
  });

  it("should hide the image when the user clicks Hide", async () => {
    const { onHide, onReveal } = renderTile({ isRevealed: true });

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.numbersHide }));

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it("should show an error when loading fails", () => {
    renderTile({ status: "failed" });

    expect(screen.getByText(CARD_COPY.numbersFailed)).toBeVisible();
  });
});
