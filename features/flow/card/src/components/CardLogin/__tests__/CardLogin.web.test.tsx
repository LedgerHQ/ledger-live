import React from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLogin } from "../CardLogin.web";

const defaultProps: React.ComponentProps<typeof CardLogin> = {
  loginLabel: "Login",
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
};

function renderCardLogin(props: Partial<React.ComponentProps<typeof CardLogin>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardLogin {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardLogin (Web)", () => {
  it("renders the login action", () => {
    const { container } = renderCardLogin();

    expect(container).toHaveTextContent("Login");
  });

  it("renders a login error when provided", () => {
    const { container } = renderCardLogin({
      errorMessage: "Unable to start login. Please try again.",
    });

    expect(container).toHaveTextContent("Unable to start login. Please try again.");
  });
});
