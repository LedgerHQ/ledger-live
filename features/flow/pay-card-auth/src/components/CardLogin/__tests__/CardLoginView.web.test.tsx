import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLoginView } from "../CardLoginView.web";

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Ledger Card",
  description: "Log in to manage your Ledger Card",
  loginLabel: "Login",
  isHidden: false,
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
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

  it("should render nothing once the user is signed in", () => {
    renderCardLoginView({ isHidden: true });

    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });
});
