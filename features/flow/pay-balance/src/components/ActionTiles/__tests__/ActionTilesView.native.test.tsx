import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ActionTilesView } from "../ActionTilesView";
import type { ActionTilesViewProps } from "../types";
import { i18nWrapper } from "../../../__tests__/i18nWrapper";

const RESOURCES = {
  en: { translation: { payTab: { actions: { deposit: "Add stablecoin", request: "Request" } } } },
};

function renderView(props: ActionTilesViewProps) {
  return render(<ActionTilesView {...props} />, { wrapper: i18nWrapper(RESOURCES) });
}

const defaultProps: ActionTilesViewProps = {
  tiles: [
    { id: "deposit", onOpenFlow: jest.fn() },
    { id: "request", onOpenFlow: jest.fn() },
  ],
};

describe("ActionTilesView (Native)", () => {
  it("should render a button for each tile", () => {
    renderView(defaultProps);

    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
    expect(screen.getByTestId("action-tile-request")).toBeTruthy();
  });

  it("should call onOpenFlow when a tile is pressed", () => {
    const onOpenFlow = jest.fn();
    renderView({ tiles: [{ id: "deposit", onOpenFlow }] });

    screen.getByTestId("action-tile-deposit").props.onPress();

    expect(onOpenFlow).toHaveBeenCalledTimes(1);
  });

  it("should render each tile label from the mounted i18n provider", () => {
    renderView(defaultProps);

    expect(screen.getByText("Add stablecoin")).toBeTruthy();
    expect(screen.getByText("Request")).toBeTruthy();
  });

  it("should not render the pay tile, which is only offered on web", () => {
    renderView({ tiles: [...defaultProps.tiles, { id: "pay", onOpenFlow: jest.fn() }] });

    expect(screen.queryByTestId("action-tile-pay")).toBeNull();
    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
  });
});
