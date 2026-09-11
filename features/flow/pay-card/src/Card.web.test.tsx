import React from "react";
import { render, screen } from "@testing-library/react";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardProps } from "./Card.types";

let mockStatus: PayCardAuthStatus = "unknown";

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <div data-testid="card-login" />,
  useCardAuthStatus: () => mockStatus,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardDetails: ({ cardVisual }: { cardVisual?: unknown }) => (
    <div data-testid={cardVisual ? "card-details-with-visual" : "card-details"} />
  ),
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
    mockStatus = "unknown";
  });

  it("always shows the host title", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  describe("while resolving the session", () => {
    it("shows only the bare artwork, holding back the widget and the card details", () => {
      render(<Card title={title} oauthConfig={oauthConfig} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });
  });

  describe("while signed out", () => {
    beforeEach(() => {
      mockStatus = "signedOut";
    });

    it("shows the bare artwork above the login, with no card details or widget", () => {
      render(<Card title={title} oauthConfig={oauthConfig} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
    });

    it("never builds the balance overlay, even when the host provides a formatter and label", () => {
      render(
        <Card
          title={title}
          oauthConfig={oauthConfig}
          formatCountervalue={formatCountervalue}
          balanceLabel="Balance"
        />,
      );

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });
  });

  describe("once signed in", () => {
    beforeEach(() => {
      mockStatus = "signedIn";
    });

    it("shows the widget and the card details, with no login or bare artwork", () => {
      render(<Card title={title} oauthConfig={oauthConfig} />);

      expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
    });

    it("hands the card visual to the details block once the host provides a formatter and label", () => {
      render(
        <Card
          title={title}
          oauthConfig={oauthConfig}
          formatCountervalue={formatCountervalue}
          balanceLabel="Balance"
        />,
      );

      expect(screen.getByTestId("card-details-with-visual")).toBeVisible();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
    });
  });
});
