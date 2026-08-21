import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLogoutView } from "../CardLogoutView.native";

const defaultProps: React.ComponentProps<typeof CardLogoutView> = {
  title: "Card",
  idLabel: "Account",
  userId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationLabel: "Verification",
  verificationValue: "In review",
  logoutLabel: "Log out",
  isLoading: false,
  onLogoutPress: jest.fn(),
};

function renderCardLogoutView(props: Partial<React.ComponentProps<typeof CardLogoutView>> = {}) {
  return render(<CardLogoutView {...defaultProps} {...props} />);
}

describe("CardLogoutView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the card holder and the logout action", () => {
    renderCardLogoutView();

    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText(/3f2504e0-4f89-11d3-9a0c-0305e82c3301/)).toBeTruthy();
    expect(screen.getByText(/In review/)).toBeTruthy();
    expect(screen.getByLabelText("Log out")).toBeTruthy();
  });

  it("should call the logout handler when the action is pressed", () => {
    const onLogoutPress = jest.fn();
    renderCardLogoutView({ onLogoutPress });

    fireEvent.press(screen.getByLabelText("Log out"));

    expect(onLogoutPress).toHaveBeenCalledTimes(1);
  });
});
