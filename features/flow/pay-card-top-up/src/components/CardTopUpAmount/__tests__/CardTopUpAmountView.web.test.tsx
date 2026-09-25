import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { CardTopUpAmountViewProps } from "../../../types";
import { CardTopUpAmountView } from "../CardTopUpAmountView.web";
import { buildAmountViewProps, CARD_TOP_UP_RESOURCES } from "./fixtures";

function renderView(overrides: Partial<CardTopUpAmountViewProps> = {}) {
  const props = buildAmountViewProps(overrides);
  render(
    <I18nTestProvider resources={CARD_TOP_UP_RESOURCES}>
      <Dialog open>
        <DialogContent>
          <CardTopUpAmountView {...props} />
        </DialogContent>
      </Dialog>
    </I18nTestProvider>,
  );
  return { props, user: userEvent.setup() };
}

describe("CardTopUpAmountView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the asset and the converted amount", () => {
    renderView();

    expect(screen.getByText("Top up USDC")).toBeVisible();
    expect(screen.getByTestId("card-top-up-secondary-value")).toHaveTextContent("0.001 BTC");
  });

  it("forwards the typed amount text", () => {
    const { props } = renderView({ amountText: "" });

    fireEvent.change(screen.getByTestId("card-top-up-amount-input"), {
      target: { value: "42" },
    });

    expect(props.onAmountChange).toHaveBeenCalledWith("42");
  });

  it("switches the input mode and applies a ratio", async () => {
    const { props, user } = renderView();

    await user.click(screen.getByTestId("card-top-up-toggle-input-mode"));
    await user.click(screen.getByTestId("card-top-up-ratio-max"));

    expect(props.onToggleInputMode).toHaveBeenCalledTimes(1);
    expect(props.ratios[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it("hides the mode switch when there is no rate", () => {
    renderView({ canToggleInputMode: false, secondaryValue: null });

    expect(screen.queryByTestId("card-top-up-toggle-input-mode")).toBeNull();
    expect(screen.queryByTestId("card-top-up-secondary-value")).toBeNull();
  });

  it("shows the amount error and blocks the review", () => {
    renderView({ amountError: "Too much", canSubmit: false });

    expect(screen.getByTestId("card-top-up-amount-error")).toHaveTextContent("Too much");
    expect(screen.getByTestId("card-top-up-submit")).toBeDisabled();
  });

  it("submits and opens the legal links", async () => {
    const { props, user } = renderView();

    await user.click(screen.getByTestId("card-top-up-submit"));
    await user.click(screen.getByText("Terms & Conditions"));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onOpenLegal).toHaveBeenCalledTimes(1);
  });
});
