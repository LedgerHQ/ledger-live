import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CardAssetsView } from "../CardAssetsView.web";
import { CARD_ASSETS_COPY } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

const ready: CardAssetsViewModel = {
  isVisible: true,
  title: CARD_ASSETS_COPY.title,
  status: "ready",
  rows: [
    { id: "w-usdc", ticker: "USDC", cryptoAmount: "125.40 USDC" },
    { id: "w-usdt", ticker: "USDT", cryptoAmount: null },
  ],
  emptyLabel: CARD_ASSETS_COPY.empty,
  errorLabel: CARD_ASSETS_COPY.error,
  manageLabel: CARD_ASSETS_COPY.manage,
  manageTitle: CARD_ASSETS_COPY.manageTitle,
  addAssetLabel: CARD_ASSETS_COPY.add,
  manage: "closed",
  onManagePress: jest.fn(),
  onManageClose: jest.fn(),
};

describe("CardAssetsView (web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render nothing while signed out", () => {
    const { container } = render(<CardAssetsView {...ready} isVisible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should show the Assets title without rows while loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.queryAllByText("125.40 USDC")).toHaveLength(0);
  });

  it("should show the error copy when the wallets read fails", () => {
    render(<CardAssetsView {...ready} status="error" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeVisible();
  });

  it("should show the empty copy when there are no linked wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />);

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeVisible();
  });

  it("should list each wallet ticker and crypto amount", () => {
    render(<CardAssetsView {...ready} />);

    expect(screen.getByText("USDC")).toBeVisible();
    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByText("USDT")).toBeVisible();
  });

  it("should open the manage dialog with the same linked wallets", () => {
    render(<CardAssetsView {...ready} manage="open" />);

    expect(screen.getByRole("heading", { name: CARD_ASSETS_COPY.manageTitle })).toBeVisible();
    expect(screen.getAllByText("USDC")).toHaveLength(2);
  });

  it("should call onAddAsset when Add asset is pressed", () => {
    const onAddAsset = jest.fn();
    const onManageClose = jest.fn();

    render(
      <CardAssetsView
        {...ready}
        manage="open"
        onAddAsset={onAddAsset}
        onManageClose={onManageClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: CARD_ASSETS_COPY.add }));

    expect(onManageClose).toHaveBeenCalledTimes(1);
    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });
});
