import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ActionTilesView } from "../ActionTilesView.native";
import type { ActionTilesViewProps } from "../types";

const defaultProps: ActionTilesViewProps = {
  tiles: [
    { id: "deposit", label: "Deposit", onPress: jest.fn() },
    { id: "request", label: "Request", onPress: jest.fn() },
  ],
};

describe("ActionTilesView (Native)", () => {
  it("should render a button for each tile", () => {
    render(<ActionTilesView {...defaultProps} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
    expect(screen.getByTestId("action-tile-request")).toBeTruthy();
  });

  it("should call onPress when a tile is pressed", () => {
    const onPress = jest.fn();
    render(<ActionTilesView tiles={[{ id: "deposit", label: "Deposit", onPress }]} />);

    screen.getByTestId("action-tile-deposit").props.onPress();

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
