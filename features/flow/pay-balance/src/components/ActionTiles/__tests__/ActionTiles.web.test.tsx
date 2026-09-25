import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { ActionTiles } from "../ActionTiles";
import type { ActionTilesProps } from "../types";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

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
    const onPress = jest.fn();
    renderWithStyle(
      <ActionTiles
        {...buildProps({
          tiles: [{ id: "deposit", onPress, appearance: "base" }],
        })}
      />,
    );

    fireEvent.click(screen.getByTestId("action-tile-deposit"));

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "deposit",
      buttonLocation: "quick action",
      page: "Pay",
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
