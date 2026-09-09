import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import type { CardProps } from "./Card.types";

let mockIsSignedIn = false;

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <View testID="card-login" />,
  useIsCardSignedIn: () => mockIsSignedIn,
}));

jest.mock("@features/flow-pay-card-details", () => ({
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
    mockIsSignedIn = false;
  });

  it("composes the card details block with the auth login", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-details")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
  });

  it("leaves the title to the login block while nobody is signed in", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.queryByText(title)).toBeNull();
  });

  it("shows the title once the card holder is signed in", () => {
    mockIsSignedIn = true;

    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  it("mounts the onboarding widget", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
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
    expect(screen.getByTestId("card-login")).toBeVisible();
  });
});
