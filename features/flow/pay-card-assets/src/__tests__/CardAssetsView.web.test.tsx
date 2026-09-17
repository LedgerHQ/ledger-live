import React from "react";
import { cleanup, render } from "@testing-library/react";
import { CardAssetsView } from "../CardAssetsView.web";
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

describe("CardAssetsView (web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render nothing until the desktop list is implemented", () => {
    const { container } = render(<CardAssetsView {...ready} />);

    expect(container).toBeEmptyDOMElement();
  });
});
