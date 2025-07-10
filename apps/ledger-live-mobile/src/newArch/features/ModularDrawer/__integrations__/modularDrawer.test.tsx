import React from "react";
import { render } from "@tests/test-renderer";
import { ModularDrawer } from "../ModularDrawer";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDrawerStep } from "../types";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";

const handleDrawerClose = jest.fn();
const selectedStep = ModularDrawerStep.Asset;
const currencies = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
  { id: "ethereum", name: "Ethereum", ticker: "ETH" },
  { id: "arbitrum", name: "Arbitrum", ticker: "ARB" },
  { id: "base", name: "Base", ticker: "BASE" },
] as CryptoOrTokenCurrency[];

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

describe("ModularDrawer integration", () => {
  it("should allow full navigation: asset → network → account, with back navigation at each step", async () => {
    const { getByText, getByTestId, user } = render(
      <ModularDrawer
        isOpen={true}
        onClose={handleDrawerClose}
        selectedStep={selectedStep}
        currencies={currencies}
      />,
    );

    // Asset selection
    expect(getByText(/select asset/i)).toBeVisible();

    // Select Ethereum (should go to network selection)
    await user.press(getByText(/ethereum/i));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByTestId("modal-back-button"));
    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/ethereum/i));
    expect(getByText(/select network/i)).toBeVisible();

    // Select Arbitrum (Network) (should go to account selection)
    await user.press(getByText(/arbitrum/i));
    expect(getByText(/select account/i)).toBeVisible();

    await user.press(getByTestId("modal-back-button"));
    expect(getByText(/select network/i)).toBeVisible();

    // Select Ethereum (Network) (should go to account selection)
    await user.press(getByText(/ethereum/i));
    expect(getByText(/select account/i)).toBeVisible();
  });

  it("should go directly to account selection for Bitcoin, and allow back to asset and forward again", async () => {
    const { getByText, getByTestId, user } = render(
      <ModularDrawer
        isOpen={true}
        onClose={handleDrawerClose}
        selectedStep={selectedStep}
        currencies={currencies}
      />,
    );

    expect(getByText(/select asset/i)).toBeVisible();

    // Select Bitcoin (should go directly to account selection)
    await user.press(getByText(/bitcoin/i));
    expect(getByText(/select account/i)).toBeVisible();

    await user.press(getByTestId("modal-back-button"));
    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/bitcoin/i));
    expect(getByText(/select account/i)).toBeVisible();
  });
});
