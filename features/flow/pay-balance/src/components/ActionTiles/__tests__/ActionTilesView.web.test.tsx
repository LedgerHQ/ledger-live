import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style/web";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ActionTilesView } from "../ActionTilesView";
import type { ActionTilesViewProps } from "../types";

const RESOURCES = {
  en: {
    translation: {
      payTab: { actions: { deposit: "Add stablecoin", request: "Request", pay: "New payment" } },
    },
  },
};

function renderWithStyle(ui: React.ReactElement) {
  return render(
    <I18nTestProvider resources={RESOURCES}>
      <StyleProvider colorScheme="dark">{ui}</StyleProvider>
    </I18nTestProvider>,
  );
}

const defaultProps: ActionTilesViewProps = {
  tiles: [
    { id: "deposit", onOpenFlow: jest.fn(), appearance: "base" },
    { id: "request", onOpenFlow: jest.fn(), appearance: "transparent" },
    { id: "pay", onOpenFlow: jest.fn(), appearance: "transparent" },
  ],
};

describe("ActionTilesView (Web)", () => {
  it("should render a button for each tile", () => {
    renderWithStyle(<ActionTilesView {...defaultProps} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
    expect(screen.getByTestId("action-tile-request")).toBeVisible();
    expect(screen.getByTestId("action-tile-pay")).toBeVisible();
  });

  it("should call onOpenFlow when a tile is clicked", () => {
    const onOpenFlow = jest.fn();
    renderWithStyle(
      <ActionTilesView tiles={[{ id: "deposit", onOpenFlow, appearance: "base" }]} />,
    );

    fireEvent.click(screen.getByTestId("action-tile-deposit"));

    expect(onOpenFlow).toHaveBeenCalledTimes(1);
  });

  it("should render each tile label from the mounted i18n provider", () => {
    renderWithStyle(<ActionTilesView {...defaultProps} />);

    expect(screen.getByText("Add stablecoin")).toBeVisible();
    expect(screen.getByText("Request")).toBeVisible();
    expect(screen.getByText("New payment")).toBeVisible();
  });
});
