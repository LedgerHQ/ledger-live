import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { Reveal } from "./Reveal";
import type { RevealTileProps } from "../../types";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  return {
    Eye: () => createElement("svg", { "data-testid": "reveal-eye" }),
    Spinner: () => createElement("svg", { "data-testid": "reveal-spinner" }),
    TileButton: ({
      icon: Icon,
      children,
      ...props
    }: {
      icon: React.ComponentType;
      children: React.ReactNode;
    }) => createElement("button", { type: "button", ...props }, createElement(Icon), children),
  };
});

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

  it("should show a spinner in place of the eye icon while loading", () => {
    renderReveal({ status: "loading" });

    expect(screen.getByTestId("reveal-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("reveal-eye")).not.toBeInTheDocument();
  });

  it("should show the eye icon when not loading", () => {
    renderReveal();

    expect(screen.getByTestId("reveal-eye")).toBeInTheDocument();
    expect(screen.queryByTestId("reveal-spinner")).not.toBeInTheDocument();
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
