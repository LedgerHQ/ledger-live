import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { CardAssetsView } from "../CardAssetsView.web";
import { CARD_ASSETS_COPY } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

const ready: CardAssetsViewModel = {
  isVisible: true,
  title: CARD_ASSETS_COPY.title,
  status: "ready",
  rows: [
    {
      id: "w-usdc",
      name: "USD Coin",
      ticker: "USDC",
      cryptoAmount: "125.40 USDC",
      fiatAmount: "$125.40",
      ledgerId: "ethereum/erc20/usd_coin",
    },
    { id: "w-usdt", name: "Tether", ticker: "USDT", cryptoAmount: null, fiatAmount: null },
  ],
  emptyLabel: CARD_ASSETS_COPY.empty,
  errorLabel: CARD_ASSETS_COPY.error,
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

  it("should list name above ticker and preferred currency above crypto", () => {
    render(<CardAssetsView {...ready} />);

    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByText("USDC")).toBeVisible();
    expect(screen.getByText("$125.40")).toBeVisible();
    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByText("Tether")).toBeVisible();
    expect(screen.getByText("USDT")).toBeVisible();
  });

  it("should show the bundle fallback icon when ledgerId is absent", () => {
    render(
      <CardAssetsView
        {...ready}
        rows={[
          {
            id: "w-unmapped",
            name: "XYZ",
            ticker: "XYZ",
            cryptoAmount: null,
            fiatAmount: null,
          },
        ]}
      />,
    );

    const row = screen.getByTestId("card-assets-item-w-unmapped");

    expect(screen.getAllByText("XYZ")).toHaveLength(2);
    expect(row.querySelector("[ledgerid]")).toBeNull();
    expect(row.querySelector('[appearance="icon"]')).not.toBeNull();
    expect(row.querySelector(".pointer-events-none")).not.toBeNull();
  });
});
