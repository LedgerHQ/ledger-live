import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../types";

function renderWithStyle(ui: React.ReactElement) {
  return render(<StyleProvider colorScheme="dark">{ui}</StyleProvider>);
}

function buildProps(overrides: Partial<ActionTilesProps> = {}): ActionTilesProps {
  return {
    tiles: [
      { id: "deposit", label: "Deposit", onPress: jest.fn() },
      { id: "request", label: "Request", onPress: jest.fn() },
    ],
    page: "Pay",
    ...overrides,
  };
}

describe("ActionTiles (Web)", () => {
  it("should render a button for each tile", () => {
    renderWithStyle(<ActionTiles {...buildProps()} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
    expect(screen.getByTestId("action-tile-request")).toBeVisible();
  });

  it("should fire tracking then the tile handler on press", () => {
    const onTrackEvent = jest.fn();
    const onPress = jest.fn();
    renderWithStyle(
      <ActionTiles
        {...buildProps({ tiles: [{ id: "deposit", label: "Deposit", onPress }], onTrackEvent })}
      />,
    );

    fireEvent.click(screen.getByTestId("action-tile-deposit"));

    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "deposit",
      buttonLocation: "quick_action",
      page: "Pay",
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
