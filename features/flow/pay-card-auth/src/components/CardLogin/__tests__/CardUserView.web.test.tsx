import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardUserView } from "../CardUserView.web";

const defaultProps: React.ComponentProps<typeof CardUserView> = {
  title: "Card",
  idLabel: "Account",
  userId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationLabel: "Verification",
  verificationValue: "Verified",
  logoutLabel: "Log out",
  isLoading: false,
  onLogoutPress: jest.fn(),
};

function renderCardUserView(props: Partial<React.ComponentProps<typeof CardUserView>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardUserView {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardUserView (Web)", () => {
  it("should render the card holder and the logout action", () => {
    renderCardUserView();

    expect(screen.getByText("Account: 3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBeVisible();
    expect(screen.getByText("Verification: Verified")).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  it("should call the logout handler when the action is pressed", () => {
    const onLogoutPress = jest.fn();
    renderCardUserView({ onLogoutPress });

    screen.getByRole("button", { name: "Log out" }).click();

    expect(onLogoutPress).toHaveBeenCalledTimes(1);
  });
});
