import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardProps } from "./Card.types";

let mockStatus: PayCardAuthStatus = "unknown";

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <View testID="card-login" />,
  useCardAuthStatus: () => mockStatus,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <View testID="card-artwork" />,
  CardDetails: ({ cardVisual }: { cardVisual?: unknown }) => (
    <View testID={cardVisual ? "card-details-with-visual" : "card-details"} />
  ),
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: () => <View testID="card-onboarding-widget" />,
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

describe("Card (native)", () => {
  beforeEach(() => {
    mockStatus = "unknown";
  });

  describe("while resolving the session", () => {
    it("shows only the bare artwork, holding back the widget and card details", () => {
      render(<Card title={title} oauthConfig={oauthConfig} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).toBeNull();
      expect(screen.queryByTestId("card-details")).toBeNull();
    });
  });

  describe("while signed out", () => {
    beforeEach(() => {
      mockStatus = "signedOut";
    });

    it("shows the bare artwork above the login, with no card details", () => {
      render(<Card title={title} oauthConfig={oauthConfig} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
      expect(screen.queryByTestId("card-details")).toBeNull();
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
      expect(screen.queryByTestId("card-details-with-visual")).toBeNull();
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
      expect(screen.queryByTestId("card-login")).toBeNull();
      expect(screen.queryByTestId("card-artwork")).toBeNull();
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
      expect(screen.queryByTestId("card-details")).toBeNull();
      expect(screen.queryByTestId("card-login")).toBeNull();
    });
  });
});
