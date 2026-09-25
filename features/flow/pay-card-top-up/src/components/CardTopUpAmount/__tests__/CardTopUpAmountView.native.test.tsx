import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { CardTopUpAmountViewProps } from "../../../types";
import { CardTopUpAmountView } from "../CardTopUpAmountView.native";
import { buildAmountViewProps, CARD_TOP_UP_RESOURCES } from "./fixtures";

function renderView(overrides: Partial<CardTopUpAmountViewProps> = {}) {
  const props = buildAmountViewProps(overrides);
  render(
    <I18nTestProvider resources={CARD_TOP_UP_RESOURCES}>
      <CardTopUpAmountView {...props} />
    </I18nTestProvider>,
  );
  return { props, user: userEvent.setup() };
}

describe("CardTopUpAmountView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("builds the amount from keypad presses", async () => {
    const { props, user } = renderView({ amountText: "10" });

    await user.press(screen.getByTestId("card-top-up-key-5"));
    await user.press(screen.getByTestId("card-top-up-key-decimal"));

    expect(props.onAmountChange).toHaveBeenNthCalledWith(1, "105");
    expect(props.onAmountChange).toHaveBeenNthCalledWith(2, "10.");
  });

  it("deletes the last digit", async () => {
    const { props, user } = renderView({ amountText: "105" });

    await user.press(screen.getByLabelText("Delete last digit"));

    expect(props.onAmountChange).toHaveBeenCalledWith("10");
  });

  it("switches the input mode and applies a ratio", async () => {
    const { props, user } = renderView();

    await user.press(screen.getByTestId("card-top-up-toggle-input-mode"));
    await user.press(screen.getByTestId("card-top-up-ratio-25"));

    expect(props.onToggleInputMode).toHaveBeenCalledTimes(1);
    expect(props.ratios[0].onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows the amount error and disables the review", () => {
    renderView({ amountError: "Too much", canSubmit: false });

    expect(screen.getByTestId("card-top-up-amount-error")).toHaveTextContent("Too much");
    expect(screen.getByTestId("card-top-up-submit")).toHaveProp("disabled", true);
  });

  it("submits and opens the legal links", async () => {
    const { props, user } = renderView();

    await user.press(screen.getByTestId("card-top-up-submit"));
    await user.press(screen.getByText("Privacy Policy"));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onOpenLegal).toHaveBeenCalledTimes(1);
  });
});
