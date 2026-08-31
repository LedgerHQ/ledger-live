import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../types";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";

function buildProps(overrides: Partial<ActionTilesProps> = {}): ActionTilesProps {
  return {
    tiles: [
      { id: "deposit", onPress: jest.fn(), appearance: "base" },
      { id: "request", onPress: jest.fn(), appearance: "transparent" },
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
        {...buildProps({
          tiles: [{ id: "deposit", onPress, appearance: "base" }],
          onTrackEvent,
        })}
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
