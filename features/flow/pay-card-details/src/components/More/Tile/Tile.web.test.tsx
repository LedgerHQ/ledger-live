import React from "react";
import { render, screen } from "@testing-library/react";
import { WebTestWrapper } from "../../../__tests__/webTestWrapper";
import { Tile } from "./Tile";
import { buildMoreViewProps } from "../fixtures";

const defaultProps = buildMoreViewProps();

function renderTile(props: Partial<React.ComponentProps<typeof Tile>> = {}) {
  return render(<Tile {...defaultProps} {...props} />, { wrapper: WebTestWrapper });
}

describe("More Tile (Web)", () => {
  it("should render the More tile with its label", () => {
    renderTile();

    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("should call the More handler when the tile is clicked", () => {
    const onMorePress = jest.fn();
    renderTile({ onMorePress });

    screen.getByRole("button", { name: "More" }).click();

    expect(onMorePress).toHaveBeenCalledTimes(1);
  });

  it("should render no sheet while it is closed", () => {
    renderTile();

    expect(screen.queryByTestId("more-sheet")).toBeNull();
  });

  it("should render the sheet while it is open", () => {
    renderTile({ isSheetOpen: true });

    expect(screen.getByTestId("more-sheet")).toBeVisible();
    expect(screen.getByText("Manage PIN Code")).toBeVisible();
  });
});
