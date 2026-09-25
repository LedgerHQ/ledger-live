import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLogin } from "../index.web";
import type { CardLoginProps, CardLoginViewModel } from "../types";

let viewModel: CardLoginViewModel = null;

jest.mock("../useCardLoginViewModel", () => ({
  useCardLoginViewModel: () => viewModel,
}));

const oauthConfig: CardLoginProps["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client",
  redirectUri: "ledgerlive://card",
};

function renderCardLogin() {
  return render(
    <StyleProvider colorScheme="dark">
      <CardLogin oauthConfig={oauthConfig} callback={null}>
        <div data-testid="card-artwork" />
      </CardLogin>
    </StyleProvider>,
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

describe("CardLogin (Web)", () => {
  it("should stand a skeleton in for the artwork while the session resolves", () => {
    viewModel = buildViewModel(true);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork-skeleton")).toBeVisible();
    expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
  });

  it("should show the artwork once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByTestId("card-artwork-skeleton")).not.toBeInTheDocument();
  });

  it("should show the login block once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByRole("heading", { name: "Get your crypto card" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Get card" })).toBeVisible();
  });

  it("should show the artwork when the holder is signed in already", () => {
    viewModel = null;

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Get your crypto card" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Get card" })).toBeNull();
  });
});
