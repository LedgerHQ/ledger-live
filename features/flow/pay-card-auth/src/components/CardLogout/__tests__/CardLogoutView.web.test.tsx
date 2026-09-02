import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardLogoutView } from "../CardLogoutView.web";

const defaultProps: React.ComponentProps<typeof CardLogoutView> = {
  moreLabel: "More",
  sheetTitle: "More",
  rows: [
    { id: "managePin", title: "Manage PIN Code", onPress: jest.fn() },
    { id: "accessBaanx", title: "Access to Baanx", onPress: jest.fn() },
    { id: "help", title: "Help", onPress: jest.fn() },
    { id: "logout", title: "Logout", onPress: jest.fn() },
  ],
  isSheetOpen: false,
  onMorePress: jest.fn(),
  onSheetClose: jest.fn(),
};

function renderCardLogoutView(props: Partial<React.ComponentProps<typeof CardLogoutView>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardLogoutView {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardLogoutView (Web)", () => {
  it("should render the More tile with its label", () => {
    renderCardLogoutView();

    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("should call the More handler when the tile is clicked", () => {
    const onMorePress = jest.fn();
    renderCardLogoutView({ onMorePress });

    screen.getByRole("button", { name: "More" }).click();

    expect(onMorePress).toHaveBeenCalledTimes(1);
  });

  it("should render no sheet while it is closed", () => {
    renderCardLogoutView();

    expect(screen.queryByTestId("card-more-sheet")).toBeNull();
  });

  it("should render the sheet while it is open", () => {
    // The pair of cases is what proves the wiring: on its own, the closed case above still passes
    // when the open flag never reaches the sheet.
    renderCardLogoutView({ isSheetOpen: true });

    expect(screen.getByTestId("card-more-sheet")).toBeVisible();
    expect(screen.getByText("Manage PIN Code")).toBeVisible();
  });
});
