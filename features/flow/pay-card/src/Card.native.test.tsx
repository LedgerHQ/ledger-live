import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import type { CardProps } from "./Card.types";

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <View testID="card-login" />,
  CardMore: () => <View testID="card-more" />,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <View testID="card-artwork" />,
  CardVisual: () => <View testID="card-visual" />,
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

describe("Card (native)", () => {
  it("composes the bare artwork with the auth login and More menu", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-more")).toBeVisible();
  });

  it("leaves the title to the login block, which carries its own subheader", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.queryByText(title)).toBeNull();
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
    expect(screen.queryByTestId("card-artwork")).toBeNull();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-more")).toBeVisible();
  });
});
