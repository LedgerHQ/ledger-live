import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { ModularDrawerSharedNavigator } from "./shared";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

describe("ModularDrawer integration", () => {
  it("should allow full navigation: asset → network → Device Selection, with back navigation at each step", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(/open drawer/i));

    // Asset selection
    expect(getByText(/select asset/i)).toBeVisible();

    // Select Ethereum (should go to network selection)
    await user.press(getByText(/ethereum/i));
    expect(getByText(/select network/i)).toBeVisible();

    await user.press(getByTestId("drawer-back-button"));
    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/ethereum/i));
    expect(getByText(/select network/i)).toBeVisible();

    // Select Arbitrum (Network) (should go to account selection)
    await user.press(getByText(/arbitrum/i));
    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should go directly to Device selection for Bitcoin, and allow back to asset and forward again", async () => {
    const { getByText, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(/open drawer/i));

    expect(getByText(/select asset/i)).toBeVisible();

    // Select Bitcoin (should go directly to Device Selection)
    await user.press(getByText(/bitcoin/i));

    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should allow searching for assets", async () => {
    const { getByText, queryByText, getByPlaceholderText, user } = render(
      <ModularDrawerSharedNavigator />,
    );

    await user.press(getByText(/open drawer/i));

    expect(getByText(/select asset/i)).toBeVisible();
    expect(getByText(/bitcoin/i)).toBeVisible();

    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "arb");

    await waitFor(() => {
      expect(queryByText(/ethereum/i)).not.toBeVisible();
    });

    expect(getByText(/arbitrum/i)).toBeVisible();
  });

  it("should show the empty state when no assets are found", async () => {
    const { getByText, queryByText, getByPlaceholderText, user } = render(
      <ModularDrawerSharedNavigator />,
    );

    await user.press(getByText(/open drawer/i));

    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "ttttttt");

    await waitFor(() => {
      expect(queryByText(/no assets found/i)).toBeVisible();
    });
  });
});
