import React from "react";
import { render, screen } from "tests/testSetup";
import { bitcoinCurrency, ethereumCurrency } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { AccountAssetCurrency } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import { AccountAssetsCell } from "../AccountAssetsCell";

const makeCurrencies = (count: number): AccountAssetCurrency[] => {
  const base = [ethereumCurrency, usdcToken, bitcoinCurrency];
  return Array.from({ length: count }, (_, index) => base[index % base.length]);
};

describe("AccountAssetsCell", () => {
  it("renders nothing when there are no currencies", () => {
    const { container } = render(<AccountAssetsCell currencies={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a tooltip with all asset tickers on hover", async () => {
    const { user } = render(<AccountAssetsCell currencies={[ethereumCurrency, usdcToken]} />);

    await user.hover(screen.getByTestId("account-assets-cell"));

    expect(
      await screen.findByRole("tooltip", {
        name: `${ethereumCurrency.ticker}, ${usdcToken.ticker}`,
      }),
    ).toBeVisible();
  });

  it("shows at most four icons and an overflow badge for additional assets", () => {
    render(<AccountAssetsCell currencies={makeCurrencies(6)} />);

    expect(screen.getByTestId("account-assets-overflow")).toHaveTextContent("+2");
  });
});
