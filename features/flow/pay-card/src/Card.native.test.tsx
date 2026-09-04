import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import type { CardProps } from "./Card.types";

const mockUseCardLinkedWallets = jest.fn();
const mockCardVisual = jest.fn();

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (params: unknown) => mockUseCardLinkedWallets(params),
}));

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <View testID="card-login" />,
  CardLogout: () => <View testID="card-logout" />,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <View testID="card-artwork" />,
  CardVisual: (props: { balance: number }) => {
    mockCardVisual(props);
    return <View testID="card-visual" />;
  },
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

const resolveCounterValue: NonNullable<CardProps["resolveCounterValue"]> = () => null;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCardLinkedWallets.mockReturnValue({
    wallets: [],
    total: 0,
    isPartialTotal: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe("Card (native)", () => {
  it("composes the bare artwork with the auth login and logout", () => {
    render(<Card title={title} oauthConfig={oauthConfig} />);

    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.getByTestId("card-logout")).toBeVisible();
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
    expect(screen.getByTestId("card-logout")).toBeVisible();
  });

  it("shows the linked-wallet total as the card balance", () => {
    mockUseCardLinkedWallets.mockReturnValue({
      wallets: [],
      total: 125_40,
      isPartialTotal: false,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(
      <Card
        title={title}
        oauthConfig={oauthConfig}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
        resolveCounterValue={resolveCounterValue}
      />,
    );

    expect(mockCardVisual).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 125_40, isLoading: false }),
    );
    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(
      expect.objectContaining({ resolveCounterValue, skip: false }),
    );
  });

  it("skips the wallet queries when the host provides no resolver", () => {
    render(
      <Card
        title={title}
        oauthConfig={oauthConfig}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
      />,
    );

    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });
});
