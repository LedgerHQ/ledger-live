import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLoginView } from "../CardLoginView.web";

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Log in to access your Card",
  description: "You’ve been logged out for security",
  loginLabel: "Log in",
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

    expect(screen.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  it("should render the title and the description", () => {
    renderCardLoginView();

    expect(screen.getByText("Log in to access your Card")).toBeVisible();
    expect(screen.getByText("You’ve been logged out for security")).toBeVisible();
  });

  it("should render a login error when provided", () => {
    renderCardLoginView({
      errorMessage: "Unable to start login. Please try again.",
    });

    expect(screen.getByText("Unable to start login. Please try again.")).toBeVisible();
  });
});
