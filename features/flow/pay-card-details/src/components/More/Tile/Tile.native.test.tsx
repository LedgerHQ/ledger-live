import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Tile } from "./Tile";
import { buildMoreViewProps } from "../fixtures";

const defaultProps = buildMoreViewProps();

function renderTile(props: Partial<React.ComponentProps<typeof Tile>> = {}) {
  return render(<Tile {...defaultProps} {...props} />);
}

describe("More Tile (native)", () => {
  it("should render the More tile with its label", () => {
    renderTile();

    expect(screen.getByText("More")).toBeVisible();
    expect(screen.getByTestId("more-tile")).toBeVisible();
  });

  it("should call the More handler when the tile is pressed", async () => {
    const user = userEvent.setup();
    const onMorePress = jest.fn();
    renderTile({ onMorePress });

    await user.press(screen.getByTestId("more-tile"));

    expect(onMorePress).toHaveBeenCalledTimes(1);
  });

  it("should render no sheet content while it is closed", () => {
    renderTile();

    expect(screen.getByTestId("more-sheet").props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("more-sheet-content")).toBeNull();
  });

  it("should render the sheet while it is open", () => {
    renderTile({ isSheetOpen: true });

    expect(screen.getByTestId("more-sheet").props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("Manage PIN Code")).toBeVisible();
  });
});
