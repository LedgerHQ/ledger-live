import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ActionTilesView } from "../ActionTilesView";
import type { ActionTilesViewProps } from "../types";

const defaultProps: ActionTilesViewProps = {
  tiles: [
    { id: "deposit", label: "Deposit", onOpenFlow: jest.fn() },
    { id: "request", label: "Request", onOpenFlow: jest.fn() },
  ],
};

describe("ActionTilesView (Native)", () => {
  it("should render a button for each tile", () => {
    render(<ActionTilesView {...defaultProps} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
    expect(screen.getByTestId("action-tile-request")).toBeTruthy();
  });

  it("should call onOpenFlow when a tile is pressed", () => {
    const onOpenFlow = jest.fn();
    render(<ActionTilesView tiles={[{ id: "deposit", label: "Deposit", onOpenFlow }]} />);

    screen.getByTestId("action-tile-deposit").props.onPress();

    expect(onOpenFlow).toHaveBeenCalledTimes(1);
  });
});
