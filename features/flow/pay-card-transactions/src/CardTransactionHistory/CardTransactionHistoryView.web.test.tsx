import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactionHistoryView } from "./CardTransactionHistoryView";
import type { CardTransactionHistoryViewProps } from "./types";

const DISCLAIMER = "Provided by Monavate Onchain";
const wrapper = cardApiWrapper({ signedIn: true });

const renderView = (props: Partial<CardTransactionHistoryViewProps>) =>
  render(
    <CardTransactionHistoryView
      isLoadingMore={false}
      displayState={{ kind: "loading" }}
      onRowClick={jest.fn()}
      {...props}
    />,
    { wrapper },
  );

describe("CardTransactionHistoryView (web)", () => {
  it("renders the signed-out state with the provider disclaimer and runs the Pay action", () => {
    const onGoToPay = jest.fn();
    renderView({ displayState: { kind: "signedOut" }, onGoToPay });

    expect(screen.getByText("Log in to see your card transactions")).toBeVisible();
    expect(
      screen.getByText("Your card activity appears here once you’re logged in."),
    ).toBeVisible();
    expect(screen.getByText(DISCLAIMER)).toBeVisible();

    fireEvent.click(screen.getByTestId("card-history-signed-out-state-cta"));

    expect(onGoToPay).toHaveBeenCalledTimes(1);
  });

  it("renders the setup state with the provider disclaimer when no card is claimed", () => {
    renderView({ displayState: { kind: "unclaimed" }, onGoToPay: jest.fn() });

    expect(screen.getByText("Crypto card")).toBeVisible();
    expect(screen.getByText("Go to pay to set up your card.")).toBeVisible();
    expect(screen.getByText(DISCLAIMER)).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to Pay" })).toBeVisible();
  });

  it("renders the error state without a Pay action or disclaimer", () => {
    renderView({ displayState: { kind: "error" }, onGoToPay: jest.fn() });

    expect(screen.getByText("Couldn't load card transactions")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Go to Pay" })).not.toBeInTheDocument();
    expect(screen.queryByText(DISCLAIMER)).not.toBeInTheDocument();
  });

  it("renders the empty state without a Pay action when the host gives none", () => {
    renderView({ displayState: { kind: "empty" } });

    expect(screen.getByText("No card transactions yet")).toBeVisible();
    expect(screen.queryByTestId("card-history-empty-state-cta")).not.toBeInTheDocument();
    expect(screen.queryByText(DISCLAIMER)).not.toBeInTheDocument();
  });
});
