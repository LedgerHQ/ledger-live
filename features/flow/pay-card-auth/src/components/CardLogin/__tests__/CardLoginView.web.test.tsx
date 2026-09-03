import React from "react";
import { render, screen } from "@testing-library/react";
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
  description: "Log in to access your card",
  loginLabel: "Login",
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
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

  it("should render a login error when provided", () => {
    renderCardLoginView({
      errorMessage: "Unable to start login. Please try again.",
    });

    expect(screen.getByText("Unable to start login. Please try again.")).toBeVisible();
  });
});
