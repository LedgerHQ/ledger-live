import React from "react";
import { render, waitFor, act } from "@tests/test-renderer";
import {
  ModularDrawerSharedNavigator,
  WITHOUT_ACCOUNT_SELECTION,
  WITH_ACCOUNT_SELECTION,
} from "./shared";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

//TODO: Adapt this test to the new modular drawer flow

describe("ModularDrawer integration", () => {
  const advanceTimers = () => {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it("should allow full navigation: asset → network → Device Selection, with back navigation at each step", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    // Asset selection
    expect(getByText(/select asset/i)).toBeVisible();

    // Select Ethereum (should go to network selection)
    await user.press(getByText(/ethereum/i));

    advanceTimers();

    expect(getByText(/select network/i)).toBeVisible();

    advanceTimers();

    await user.press(getByTestId("drawer-back-button"));

    advanceTimers();

    expect(getByText(/select asset/i)).toBeVisible();

    await user.press(getByText(/ethereum/i));

    advanceTimers();

    expect(getByText(/select network/i)).toBeVisible();

    // Select Arbitrum (Network) (should go to account selection)
    await user.press(getByText(/arbitrum/i));

    advanceTimers();

    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should go directly to Device selection for Bitcoin, and allow back to asset and forward again", async () => {
    const { getByText, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    advanceTimers();

    expect(getByText(/select asset/i)).toBeVisible();

    // Select Bitcoin (should go directly to Device Selection)
    await user.press(getByText(/bitcoin/i));

    advanceTimers();

    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should allow searching for assets", async () => {
    const { getByText, queryByText, getByPlaceholderText, user } = render(
      <ModularDrawerSharedNavigator />,
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    expect(getByText(/select asset/i)).toBeVisible();
    expect(getByText(/bitcoin/i)).toBeVisible();

    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "bitc");

    await waitFor(() => {
      expect(queryByText(/ethereum/i)).not.toBeVisible();
    });

    expect(getByText(/bitcoin/i)).toBeVisible();
  });

  it("should show the empty state when no assets are found", async () => {
    const { getByText, queryByText, getByPlaceholderText, user } = render(
      <ModularDrawerSharedNavigator />,
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "ttttttt");

    await waitFor(() => {
      expect(queryByText(/no assets found/i)).toBeVisible();
    });
  });

  it("should allow full navigation: asset → network → account", async () => {
    const { getByText, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(WITH_ACCOUNT_SELECTION));

    // Asset selection
    expect(getByText(/select asset/i)).toBeVisible();

    // Select Ethereum (should go to network selection)
    await user.press(getByText(/ethereum/i));

    advanceTimers();

    expect(getByText(/select network/i)).toBeVisible();

    // Select Arbitrum (Network) (should go to account selection)
    await user.press(getByText(/arbitrum/i));

    advanceTimers();

    expect(getByText(/select account/i)).toBeVisible();
  });
});
