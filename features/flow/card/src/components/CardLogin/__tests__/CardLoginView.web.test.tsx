import React from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLoginView } from "../CardLoginView.web";

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  loginLabel: "Login",
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
  it("renders the login action", () => {
    const { container } = renderCardLoginView();

    expect(container).toHaveTextContent("Login");
  });

  it("renders a login error when provided", () => {
    const { container } = renderCardLoginView({
      errorMessage: "Unable to start login. Please try again.",
    });

    expect(container).toHaveTextContent("Unable to start login. Please try again.");
  });
});
