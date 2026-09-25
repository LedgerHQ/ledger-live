import React from "react";
import { View } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { CardLogin } from "../index.native";
import type { CardLoginProps, CardLoginViewModel } from "../types";

let viewModel: CardLoginViewModel = null;

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("../useCardLoginViewModel", () => ({
  useCardLoginViewModel: () => viewModel,
}));

jest.mock("../CardAuthError", () => ({
  CardAuthError: () => null,
}));

const oauthConfig: CardLoginProps["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client",
  redirectUri: "ledgerlive://card",
};

function renderCardLogin() {
  return render(
    <CardLogin oauthConfig={oauthConfig} callback={null}>
      <View testID="card-artwork" />
    </CardLogin>,
  );
}

function buildViewModel(isResolving: boolean): CardLoginViewModel {
  return {
    title: "Crypto Card",
    headline: "Get your crypto card",
    description: "Get 1% cashback every time you spend",
    loginLabel: "Get card",
    alreadyHaveCardLabel: null,
    isLoading: false,
    isResolving,
    error: null,
    onLoginPress: jest.fn(),
    onAlreadyHaveCardPress: jest.fn(),
    intro: {
      isOpen: false,
      title: "Spend crypto, earn cashback",
      providedBy: "Card provided by Baanx",
      rows: [],
      actions: [],
      onActionPress: jest.fn(),
      onClose: jest.fn(),
    },
  };
}

describe("CardLogin (Native)", () => {
  it("should keep the card mounted, and hide the login block, while the session resolves", () => {
    viewModel = buildViewModel(true);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByText("Crypto Card")).toBeNull();
    expect(screen.queryByLabelText("Get card")).toBeNull();
  });

  it("should show the artwork once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
  });

  it("should show the login block once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByText("Crypto Card")).toBeVisible();
    expect(screen.getByLabelText("Get card")).toBeVisible();
  });

  it("should show the artwork when the holder is signed in already", () => {
    viewModel = null;

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByText("Crypto Card")).toBeNull();
    expect(screen.queryByLabelText("Get card")).toBeNull();
  });
});
