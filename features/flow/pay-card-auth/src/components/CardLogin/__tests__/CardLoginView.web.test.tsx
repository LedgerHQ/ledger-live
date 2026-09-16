import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLoginView } from "../CardLoginView.web";
import type { CardLoginIntroViewProps } from "../types";

const intro: CardLoginIntroViewProps = {
  isOpen: false,
  title: "Spend crypto, earn cashback",
  providedBy: "Card provided by Baanx",
  rows: [],
  actions: [],
  onActionPress: jest.fn(),
  onClose: jest.fn(),
};

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Crypto Card",
  headline: "Get your crypto card",
  description: "Log in to access your card",
  loginLabel: "Login",
  alreadyHaveCardLabel: null,
  isLoading: false,
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

  it("should replace the login block with the error panel", () => {
    renderCardLoginView({
      error: {
        title: "Login could not start",
        description: "Please try again.",
        ctaLabel: "Try again",
        onRetry: jest.fn(),
      },
    });

    expect(screen.getByText("Login could not start")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });
});
