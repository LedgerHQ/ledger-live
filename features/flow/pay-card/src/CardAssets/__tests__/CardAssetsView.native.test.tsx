import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardAssetsView } from "../CardAssetsView.native";
import { CARD_ASSETS_COPY } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

const ready: CardAssetsViewModel = {
  isVisible: true,
  title: CARD_ASSETS_COPY.title,
  status: "ready",
  rows: [
    { id: "w-usdc", cryptoAmount: "125.40 USDC" },
    { id: "w-usdt", cryptoAmount: "USDT" },
  ],
  emptyLabel: CARD_ASSETS_COPY.empty,
  errorLabel: CARD_ASSETS_COPY.error,
};

describe("CardAssetsView (native)", () => {
  it("should render nothing while signed out", () => {
    render(<CardAssetsView {...ready} isVisible={false} />);

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).toBeNull();
  });

  it("should show the Assets title without rows while loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.queryByText("125.40 USDC")).toBeNull();
  });

  it("should show the error copy when the wallets read fails", () => {
    render(<CardAssetsView {...ready} status="error" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeVisible();
  });

  it("should show the empty copy when there are no linked wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeVisible();
  });

  it("should list each wallet crypto amount", () => {
    render(<CardAssetsView {...ready} />);

    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByText("USDT")).toBeVisible();
  });
});
