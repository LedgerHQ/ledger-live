import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { Reveal } from "./Reveal";
import type { RevealTileProps } from "../../types";

function renderReveal(props: Partial<RevealTileProps> = {}) {
  const onReveal = jest.fn();
  const onHide = jest.fn();

  return {
    onReveal,
    onHide,
    ...render(
      <Reveal status="idle" canHide={false} onReveal={onReveal} onHide={onHide} {...props} />,
      {
        wrapper: I18nWrapper,
      },
    ),
  };
}

describe("Reveal (web)", () => {
  it("should show View when nothing is open yet", () => {
    renderReveal();

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeVisible();
  });

  it("should ask to show numbers when the user clicks View", async () => {
    const { onReveal, onHide } = renderReveal();

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.numbersReveal }));

    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onHide).not.toHaveBeenCalled();
  });

  it("should lock View while loading", () => {
    renderReveal({ status: "loading" });

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeDisabled();
  });

  it("should show Hide when numbers are visible", () => {
    renderReveal({ status: "revealed", canHide: true });

    expect(screen.getByRole("button", { name: CARD_COPY.numbersHide })).toBeVisible();
  });

  it("should hide the image when the user clicks Hide", async () => {
    const { onHide, onReveal } = renderReveal({ status: "revealed", canHide: true });

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.numbersHide }));

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it("should show an error when loading fails", () => {
    renderReveal({ status: "failed" });

    expect(screen.getByText(CARD_COPY.numbersFailed)).toBeVisible();
  });
});
