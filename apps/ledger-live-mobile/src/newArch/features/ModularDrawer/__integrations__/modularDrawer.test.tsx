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
] as CryptoOrTokenCurrency[];

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

describe("ModularDrawer integration flow", () => {
  it("opens the drawer at step 1, goes to step 2, goes back to step 1, then navigates to step 3", async () => {
    const { getByText, getByTestId, user } = render(
      <ModularDrawer
        isOpen={true}
        onClose={handleDrawerClose}
        selectedStep={selectedStep}
        currencies={currencies}
      />,
    );

    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/bitcoin/i));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByTestId("modal-back-button"));

    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/ethereum/i));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByText(/ethereum/i)); // Will be changed once we have real networks
    expect(getByText(/select account/i)).toBeVisible();
  });
});
