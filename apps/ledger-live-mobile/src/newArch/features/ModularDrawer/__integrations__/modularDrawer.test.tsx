import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import { INITIAL_STATE } from "~/reducers/modularDrawer";
import { State } from "~/reducers/types";

import { ModularDrawerSharedNavigator } from "./shared";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

describe("ModularDrawer integration", () => {
  it("should allow full navigation: asset → network → Device Selection, with back navigation at each step", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerSharedNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        modularDrawer: {
          ...INITIAL_STATE,
        },
      }),
    });

    await user.press(getByText(/open drawer/i));

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
    expect(getByText(/Connect Device/i)).toBeVisible();

    await user.press(getByTestId("navigation-header-back-button"));

    expect(getByText(/open drawer/i)).toBeVisible();

    await waitFor(() => {
      expect(getByText(/select network/i)).toBeVisible();
    });

    // Select Ethereum (Network) (should go to account selection)
    await user.press(getByText(/ethereum/i));
    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should go directly to account selection for Bitcoin, and allow back to asset and forward again", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerSharedNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        modularDrawer: {
          ...INITIAL_STATE,
        },
      }),
    });

    await user.press(getByText(/open drawer/i));

    expect(getByText(/select asset/i)).toBeVisible();

    // Select Bitcoin (should go directly to account selection)
    await user.press(getByText(/bitcoin/i));

    expect(getByText(/Connect Device/i)).toBeVisible();

    await user.press(getByTestId("navigation-header-back-button"));

    // Check if we're back to the main screen
    expect(getByText(/open drawer/i)).toBeVisible();

    await waitFor(() => {
      expect(getByText(/select asset/i)).toBeVisible();
    });

    // Then check if the drawer is open with the asset selection

    await user.press(getByText(/bitcoin/i));
    expect(getByText(/Connect Device/i)).toBeVisible();
  });
});
