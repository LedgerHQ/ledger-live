import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CardAssetsEmptyState } from "../CardAssetsEmptyState.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";

describe("CardAssetsEmptyState (native)", () => {
  it("should show the error copy and retry the fetch when Retry is pressed", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(<CardAssetsEmptyState variant="error" onRetry={onRetry} />, { wrapper: I18nWrapper });

    expect(screen.getByTestId("card-assets-error-state")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.errorTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.errorDescription)).toBeVisible();

    await user.press(screen.getByText(CARD_ASSETS_COPY.errorCta));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should show the empty copy and add an asset when Add asset is pressed", async () => {
    const user = userEvent.setup();
    const onAddAsset = jest.fn();
    render(<CardAssetsEmptyState variant="empty" onRetry={jest.fn()} onAddAsset={onAddAsset} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByTestId("card-assets-empty-state")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.emptyTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.emptyDescription)).toBeVisible();

    await user.press(screen.getByText(CARD_ASSETS_COPY.emptyCta));

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it("should hide the empty CTA when adding an asset is not available", () => {
    render(<CardAssetsEmptyState variant="empty" onRetry={jest.fn()} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.emptyTitle)).toBeVisible();
    expect(screen.queryByText(CARD_ASSETS_COPY.emptyCta)).not.toBeOnTheScreen();
  });
});
