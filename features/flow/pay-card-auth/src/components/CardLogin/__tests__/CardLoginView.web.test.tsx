import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLoginView } from "../CardLoginView.web";
import type { CardAuthErrorCopy, CardLoginIntroViewProps } from "../types";

const intro: CardLoginIntroViewProps = {
  isOpen: false,
  title: "Spend crypto, earn cashback",
  providedBy: "Card provided by Baanx",
  rows: [],
  actions: [],
  onActionPress: jest.fn(),
  onClose: jest.fn(),
};

function buildError(overrides: Partial<CardAuthErrorCopy> = {}): CardAuthErrorCopy {
  return {
    title: "Login could not start",
    description: "Please try again.",
    ctaLabel: "Try again",
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };
}

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Crypto Card",
  headline: "Get your crypto card",
  description: "Log in to access your card",
  loginLabel: "Login",
  alreadyHaveCardLabel: null,
  isLoading: false,
  isResolving: false,
  error: null,
  onLoginPress: jest.fn(),
  onAlreadyHaveCardPress: jest.fn(),
  intro,
};

function renderCardLoginView(props: Partial<React.ComponentProps<typeof CardLoginView>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardLoginView {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardLoginView (Web)", () => {
  it("should render the login action", () => {
    renderCardLoginView();

    expect(screen.getByRole("button", { name: "Login" })).toBeVisible();
  });

  it("should render the description", () => {
    renderCardLoginView();

    expect(screen.getByText("Log in to access your card")).toBeVisible();
  });

  it("should not render its own heading", () => {
    renderCardLoginView();

    expect(screen.queryByRole("heading", { name: "Crypto Card" })).toBeNull();
  });

  it.each(["Get your crypto card", "Log in to access your Card"])(
    "should render the %s headline",
    headline => {
      renderCardLoginView({ headline });

      expect(screen.getByRole("heading", { name: headline })).toBeVisible();
    },
  );

  it("should render the login link when the copy carries one", () => {
    const onAlreadyHaveCardPress = jest.fn();
    renderCardLoginView({
      alreadyHaveCardLabel: "I already have a card",
      onAlreadyHaveCardPress,
    });

    const link = screen.getByRole("button", { name: "I already have a card" });
    fireEvent.click(link);

    expect(onAlreadyHaveCardPress).toHaveBeenCalledTimes(1);
  });

  it("should render no login link when the copy carries none", () => {
    renderCardLoginView();

    expect(screen.queryByRole("button", { name: "I already have a card" })).toBeNull();
  });

  it("should render no error dialog while there is no error", () => {
    renderCardLoginView();

    expect(screen.queryByTestId("card-auth-error-dialog")).toBeNull();
  });

  it("should open the error dialog over the login block, and hide nothing", () => {
    renderCardLoginView({ error: buildError() });

    expect(screen.getByTestId("card-auth-error-dialog")).toBeVisible();
    expect(screen.getByText("Login could not start")).toBeVisible();
    expect(screen.getByRole("button", { name: "Login" })).toBeVisible();
  });

  it("should call onRetry when the dialog action is clicked", () => {
    const onRetry = jest.fn();
    renderCardLoginView({ error: buildError({ onRetry }) });

    fireEvent.click(screen.getByTestId("card-auth-error-cta"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should show a skeleton in place of the login block while the session resolves", () => {
    renderCardLoginView({ isResolving: true });

    expect(screen.getByTestId("card-login-skeleton")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });
});
