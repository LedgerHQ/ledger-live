import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLogoutView } from "../CardLogoutView.web";

const defaultProps: React.ComponentProps<typeof CardLogoutView> = {
  title: "Card",
  idLabel: "Account",
  userId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationLabel: "Verification",
  verificationValue: "Verified",
  logoutLabel: "Log out",
  isLoading: false,
  onLogoutPress: jest.fn(),
};

function renderCardLogoutView(props: Partial<React.ComponentProps<typeof CardLogoutView>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardLogoutView {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardLogoutView (Web)", () => {
  it("should render the card holder and the logout action", () => {
    renderCardLogoutView();

    expect(screen.getByText("Account: 3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBeVisible();
    expect(screen.getByText("Verification: Verified")).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  it("should call the logout handler when the action is pressed", () => {
    const onLogoutPress = jest.fn();
    renderCardLogoutView({ onLogoutPress });

    screen.getByRole("button", { name: "Log out" }).click();

    expect(onLogoutPress).toHaveBeenCalledTimes(1);
  });
});
