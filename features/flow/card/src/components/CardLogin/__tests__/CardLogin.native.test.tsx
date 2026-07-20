import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLogin } from "../CardLogin.native";

const defaultProps: React.ComponentProps<typeof CardLogin> = {
  loginLabel: "Login",
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
};

function renderCardLogin(props: Partial<React.ComponentProps<typeof CardLogin>> = {}) {
  return render(<CardLogin {...defaultProps} {...props} />);
}

describe("CardLogin (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login action", () => {
    renderCardLogin();

    expect(screen.getByLabelText("Login")).toBeTruthy();
  });

  it("calls the login handler when pressing Login", () => {
    const onLoginPress = jest.fn();
    renderCardLogin({ onLoginPress });

    fireEvent.press(screen.getByLabelText("Login"));

    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });

  it("renders a login error when provided", () => {
    renderCardLogin({ errorMessage: "Unable to start login. Please try again." });

    expect(screen.getByText("Unable to start login. Please try again.")).toBeTruthy();
  });
});
