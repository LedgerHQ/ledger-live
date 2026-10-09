import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setLocalNodeCurrencies } from "@ledgerhq/live-common/localNode/index";
import { LocalNodeAccountBanner } from "..";

const stellar = getCryptoCurrencyById("stellar");
const ripple = getCryptoCurrencyById("ripple");

describe("LocalNodeAccountBanner Integration", () => {
  afterEach(() => setLocalNodeCurrencies([]));

  it("warns on the account of a currency running on its local node", () => {
    setLocalNodeCurrencies(["stellar"]);

    render(<LocalNodeAccountBanner currency={stellar} />);

    expect(screen.getByTestId("local-node-account-banner")).toBeVisible();
    expect(screen.getByText("Local node")).toBeVisible();
    expect(screen.getByText(/Stellar runs on a local chain, not on mainnet/)).toBeVisible();
  });

  it("stays hidden on the account of a currency running on its default network", () => {
    setLocalNodeCurrencies(["stellar"]);

    render(<LocalNodeAccountBanner currency={ripple} />);

    expect(screen.queryByTestId("local-node-account-banner")).not.toBeInTheDocument();
  });

  it("stays hidden when no currency runs on a local node", () => {
    render(<LocalNodeAccountBanner currency={stellar} />);

    expect(screen.queryByTestId("local-node-account-banner")).not.toBeInTheDocument();
  });
});
