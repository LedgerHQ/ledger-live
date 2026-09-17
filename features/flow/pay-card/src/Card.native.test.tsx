import React from "react";
import { cleanup, render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardProps } from "./Card.types";
import { I18nWrapper } from "./__tests__/i18nWrapper";

const mockUseCardAuthStatus = jest.fn<PayCardAuthStatus, []>();

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <View testID="card-login" />,
  useCardAuthStatus: () => mockUseCardAuthStatus(),
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

function renderCard(card: React.ReactElement) {
  return render(card, { wrapper: I18nWrapper });
}

const oauthConfig: CardProps["login"]["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  hostedUiUrl: "https://hosted.example",
  redirectUri: "https://card.example/callback",
};

const formatters: CardProps["formatters"] = {
  countervalue: (value: number) => ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }),
};

describe("Card (native)", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mockUseCardAuthStatus.mockReturnValue("unknown");
  });

  describe("while resolving the session", () => {
    it("shows only the bare artwork, holding back the widget and card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).toBeNull();
      expect(screen.queryByTestId("card-details")).toBeNull();
    });
  });

  describe("while signed out", () => {
    beforeEach(() => {
      mockUseCardAuthStatus.mockReturnValue("signedOut");
    });

    it("shows the bare artwork above the login, with no card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
      expect(screen.queryByTestId("card-details")).toBeNull();
    });

    it("never builds the balance overlay, even when the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).toBeNull();
    });
  });

  describe("once signed in", () => {
    beforeEach(() => {
      mockUseCardAuthStatus.mockReturnValue("signedIn");
    });

    it("shows the widget and the card details, with no login or bare artwork", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.queryByTestId("card-login")).toBeNull();
      expect(screen.queryByTestId("card-artwork")).toBeNull();
    });

    it("hands the card visual to the details block once the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-details-with-visual")).toBeVisible();
      expect(screen.queryByTestId("card-details")).toBeNull();
      expect(screen.queryByTestId("card-login")).toBeNull();
    });
  });
});
