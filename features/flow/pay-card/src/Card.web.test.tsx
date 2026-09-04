import React from "react";
import { render, screen } from "@testing-library/react";
import type { CardProps } from "./Card.types";

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <div data-testid="card-login" />,
  CardMore: () => <div data-testid="card-more" />,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardVisual: () => <div data-testid="card-visual" />,
}));

import { Card } from "./Card";

const title = "Crypto card";

const oauthConfig: CardProps["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  redirectUri: "https://card.example/callback",
};

const formatCountervalue: CardProps["formatCountervalue"] = (value: number) => ({
  integerPart: String(value),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("Card (web)", () => {
  it("renders the host title", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  it("composes the bare artwork with the auth login and More menu", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-more")).toBeVisible();
  });

  it("swaps the bare artwork for the card visual once the host provides a formatter and label", () => {
    render(
      <Card
        title={title}
        oauthConfig={oauthConfig}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
      />,
    );

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-more")).toBeVisible();
  });
});
