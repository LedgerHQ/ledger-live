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

jest.mock("../CardLoginView", () => {
  const { View: MockView } = jest.requireActual("react-native");
  return { CardLoginView: () => <MockView testID="card-login-view" /> };
});

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
  it("should stand a skeleton in for the artwork while the session resolves", () => {
    viewModel = buildViewModel(true);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork-skeleton")).toBeTruthy();
    expect(screen.queryByTestId("card-artwork")).toBeNull();
  });

  it("should show the artwork once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(screen.queryByTestId("card-artwork-skeleton")).toBeNull();
  });

  it("should show the artwork when the holder is signed in already", () => {
    viewModel = null;

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(screen.queryByTestId("card-login-view")).toBeNull();
  });
});
