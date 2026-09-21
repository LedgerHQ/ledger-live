import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardAssetsView } from "../CardAssetsView.native";
import { CARD_ASSETS_COPY } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

const ready: CardAssetsViewModel = {
  isVisible: true,
  title: CARD_ASSETS_COPY.title,
  status: "ready",
  rows: [{ id: "w-usdc", cryptoAmount: "125.40 USDC" }],
  emptyLabel: CARD_ASSETS_COPY.empty,
  errorLabel: CARD_ASSETS_COPY.error,
};

describe("CardAssetsView (native)", () => {
  it("should render nothing until the mobile list is implemented", () => {
    render(<CardAssetsView {...ready} />);

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).toBeNull();
    expect(screen.queryByText("125.40 USDC")).toBeNull();
  });
});
