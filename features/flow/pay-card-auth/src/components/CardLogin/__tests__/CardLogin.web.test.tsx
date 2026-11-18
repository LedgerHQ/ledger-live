import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style/web";
import { I18nTestProvider } from "@shared/i18n/testing";
import { CardLogin } from "../CardLogin";
import type { CardLoginProps } from "../CardLogin.types";
import type { CardLoginViewModel } from "../types";
import { CARD_LOGIN_INTRO_RESOURCES } from "./fixtures";

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
    <I18nTestProvider resources={CARD_LOGIN_INTRO_RESOURCES}>
      <StyleProvider colorScheme="dark">
        <CardLogin oauthConfig={oauthConfig} callback={null}>
          <div data-testid="card-artwork" />
        </CardLogin>
      </StyleProvider>
    </I18nTestProvider>,
  );
}

function buildViewModel(isResolving: boolean): CardLoginViewModel {
  return {
    title: "Crypto Card",
    headline: "Get your crypto card",
    description: "Get 1% cashback every time you spend",
    loginLabel: "Get card",
    showAlreadyHaveCard: false,
    isLoading: false,
    isResolving,
    error: null,
    onLoginPress: jest.fn(),
    onAlreadyHaveCardPress: jest.fn(),
    intro: {
      isOpen: false,
      title: "Spend crypto, earn cashback",
      providedBy: "Card provided by Monavate",
      rows: [],
      actions: [],
      onActionPress: jest.fn(),
      onClose: jest.fn(),
    },
  };
}

describe("CardLogin (Web)", () => {
  it("should keep the card mounted, and show the login rows as skeletons, while resolving", () => {
    viewModel = buildViewModel(true);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login-skeleton")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Get card" })).toBeNull();
  });

  it("should show the artwork once the session is resolved", () => {
    viewModel = buildViewModel(false);

    renderCardLogin();

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByTestId("card-login-skeleton")).not.toBeInTheDocument();
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
