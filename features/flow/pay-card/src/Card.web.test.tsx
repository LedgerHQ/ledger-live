import React from "react";
import { render, screen } from "@testing-library/react";
import type { CardProps } from "./Card.types";

let mockIsSignedIn = false;

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <div data-testid="card-login" />,
  useIsCardSignedIn: () => mockIsSignedIn,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardVisual: () => <div data-testid="card-visual" />,
  CardActions: () => <div data-testid="card-actions" />,
  CardNumbers: () => <div data-testid="card-numbers" />,
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: () => <div data-testid="card-onboarding-widget" />,
}));

import { Card } from "./Card";

const title = "Crypto card";

const oauthConfig: CardProps["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  hostedUiUrl: "https://hosted.example",
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
  beforeEach(() => {
    mockIsSignedIn = false;
  });

  it("renders the host title once the card holder is signed in", () => {
    mockIsSignedIn = true;

    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  it("shows the host title while nobody is signed in", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  it("composes the bare artwork with the auth login and card actions", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-actions")).toBeVisible();
  });

  it("should hide card numbers when unlock is omitted", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.queryByTestId("card-numbers")).not.toBeInTheDocument();
  });

  it("should show card numbers when unlock is passed", () => {
    render(<Card title={title} oauthConfig={oauthConfig} unlock={jest.fn()} />);

    expect(screen.getByTestId("card-numbers")).toBeVisible();
    expect(screen.queryByTestId("card-actions")).not.toBeInTheDocument();
  });

  it("mounts the onboarding widget", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
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
    expect(screen.getByTestId("card-actions")).toBeVisible();
  });
});
