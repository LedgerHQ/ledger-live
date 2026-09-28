import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CardAssetsManageFooter } from "../CardAssetsManageFooter.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";

describe("CardAssetsManageFooter", () => {
  it("should show the add asset caption and button, and forward the press", async () => {
    const user = userEvent.setup();
    const onAddAsset = jest.fn();
    render(<CardAssetsManageFooter onAddAsset={onAddAsset} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.addAssetCaption)).toBeVisible();

    await user.press(screen.getByText(CARD_ASSETS_COPY.addAsset));

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it("should render nothing when the host does not provide an add action", () => {
    render(<CardAssetsManageFooter />, { wrapper: I18nWrapper });

    expect(screen.queryByText(CARD_ASSETS_COPY.addAssetCaption)).not.toBeOnTheScreen();
    expect(screen.queryByText(CARD_ASSETS_COPY.addAsset)).not.toBeOnTheScreen();
  });
});
