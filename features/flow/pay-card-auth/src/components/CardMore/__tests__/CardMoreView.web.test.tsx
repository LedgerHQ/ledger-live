import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardMoreView } from "../CardMoreView.web";

const defaultProps: React.ComponentProps<typeof CardMoreView> = {
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

function renderCardMoreView(props: Partial<React.ComponentProps<typeof CardMoreView>> = {}) {
  return render(
    <StyleProvider colorScheme="dark">
      <CardMoreView {...defaultProps} {...props} />
    </StyleProvider>,
  );
}

describe("CardMoreView (Web)", () => {
  it("should render the More tile with its label", () => {
    renderCardMoreView();

    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("should call the More handler when the tile is clicked", () => {
    const onMorePress = jest.fn();
    renderCardMoreView({ onMorePress });

    screen.getByRole("button", { name: "More" }).click();

    expect(onMorePress).toHaveBeenCalledTimes(1);
  });

  it("should render no sheet while it is closed", () => {
    renderCardMoreView();

    expect(screen.queryByTestId("card-more-sheet")).toBeNull();
  });

  it("should render the sheet while it is open", () => {
    renderCardMoreView({ isSheetOpen: true });

    expect(screen.getByTestId("card-more-sheet")).toBeVisible();
    expect(screen.getByText("Manage PIN Code")).toBeVisible();
  });
});
