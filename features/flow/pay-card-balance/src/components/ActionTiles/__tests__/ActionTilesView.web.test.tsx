import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { ActionTilesView } from "../ActionTilesView.web";
import type { ActionTilesViewProps } from "../types";

function renderWithStyle(ui: React.ReactElement) {
  return render(<StyleProvider colorScheme="dark">{ui}</StyleProvider>);
}

const defaultProps: ActionTilesViewProps = {
  tiles: [
    { id: "deposit", label: "Deposit", onPress: jest.fn(), appearance: "base" },
    { id: "request", label: "Request", onPress: jest.fn(), appearance: "transparent" },
    { id: "pay", label: "New payment", onPress: jest.fn(), appearance: "transparent" },
  ],
};

describe("ActionTilesView (Web)", () => {
  it("should render a button for each tile", () => {
    renderWithStyle(<ActionTilesView {...defaultProps} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
    expect(screen.getByTestId("action-tile-request")).toBeVisible();
    expect(screen.getByTestId("action-tile-pay")).toBeVisible();
  });

  it("should call onPress when a tile is clicked", () => {
    const onPress = jest.fn();
    renderWithStyle(
      <ActionTilesView
        tiles={[{ id: "deposit", label: "Deposit", onPress, appearance: "base" }]}
      />,
    );

    fireEvent.click(screen.getByTestId("action-tile-deposit"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render tile labels", () => {
    renderWithStyle(<ActionTilesView {...defaultProps} />);

    expect(screen.getByText("Deposit")).toBeVisible();
    expect(screen.getByText("Request")).toBeVisible();
    expect(screen.getByText("New payment")).toBeVisible();
  });
});
