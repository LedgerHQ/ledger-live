import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLoginView } from "../CardLoginView.native";

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  loginLabel: "Login",
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
};

function renderCardLoginView(props: Partial<React.ComponentProps<typeof CardLoginView>> = {}) {
  return render(<CardLoginView {...defaultProps} {...props} />);
}

describe("CardLoginView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login action", () => {
    renderCardLoginView();

    expect(screen.getByLabelText("Login")).toBeTruthy();
  });

  it("calls the login handler when pressing Login", () => {
    const onLoginPress = jest.fn();
    renderCardLoginView({ onLoginPress });

    fireEvent.press(screen.getByLabelText("Login"));

    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });

  it("renders a login error when provided", () => {
    renderCardLoginView({ errorMessage: "Unable to start login. Please try again." });

    expect(screen.getByText("Unable to start login. Please try again.")).toBeTruthy();
  });
});
