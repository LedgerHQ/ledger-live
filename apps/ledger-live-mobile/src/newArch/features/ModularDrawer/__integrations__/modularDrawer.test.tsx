import React from "react";
import { render, waitFor, act, screen } from "@tests/test-renderer";
import {
  ModularDrawerSharedNavigator,
  WITHOUT_ACCOUNT_SELECTION,
  WITH_ACCOUNT_SELECTION,
  mockedFF,
  mockedAccounts,
  ARB_ACCOUNT,
} from "./shared";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/settings";

import { http, HttpResponse } from "msw";
import { server } from "@tests/server";
import { NetInfoStateType, useNetInfo } from "@react-native-community/netinfo";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

jest.mock("@react-native-community/netinfo", () => {
  const mockUseNetInfo = jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: "unknown",
    details: null,
  }));

  return {
    NetInfoStateType: {
      unknown: "unknown",
    },
    useNetInfo: mockUseNetInfo,
  };
});

describe("ModularDrawer integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  const advanceTimers = () => {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  it("should allow full navigation: asset → network → Device Selection, with back navigation at each step", async () => {
    const { getByText, getByTestId, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    advanceTimers();

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

    // Wait for the assets to be loaded (MSW mock))
    advanceTimers();

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

    advanceTimers();
    expect(getByText(/bitcoin/i)).toBeVisible();

    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "bitc");

    await waitFor(() => {
      expect(queryByText(/ethereum/i)).not.toBeVisible();
    });

    await waitFor(() => {
      expect(getByText(/bitcoin/i)).toBeVisible();
    });
  });

  it("should show the empty state when no assets are found", async () => {
    const { getByText, queryByText, getByPlaceholderText, user } = render(
      <ModularDrawerSharedNavigator />,
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    const searchInput = getByPlaceholderText(/search/i);
    expect(searchInput).toBeVisible();

    await user.type(searchInput, "ttttttt");

    await waitFor(() => {
      expect(queryByText(/no assets found/i)).toBeVisible();
    });
  });

  it("should allow full navigation: asset → network → account", async () => {
    const { getByText, user } = render(<ModularDrawerSharedNavigator />, {
      ...INITIAL_STATE,
      overrideInitialState: (state: State) => ({
        ...state,
        accounts: {
          active: mockedAccounts,
        },
        settings: {
          ...state.settings,
          overriddenFeatureFlags: mockedFF,
        },
        wallet: {
          ...state.wallet,
          accountNames: new Map([[ARB_ACCOUNT.id, "Arbitrum One"]]),
        },
      }),
    });

    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();

    // Wait for the assets to be loaded (MSW mock))
    await waitFor(() => expect(getByText(/select asset/i)).toBeVisible());

    // Select Ethereum (should go to network selection)
    await user.press(getByText(/ethereum/i));

    advanceTimers();

    expect(getByText(/select network/i)).toBeVisible();

    // Select Arbitrum (Network) (should go to account selection)
    await user.press(getByText(/arbitrum/i));

    advanceTimers();

    expect(getByText(/select account/i)).toBeVisible();
    expect(getByText(/Arbitrum One/i)).toBeVisible();

    expect(getByText(/add new or existing account/i)).toBeVisible();

    // Select new account (should go to Device Selection)
    await user.press(getByText(/add new or existing account/i));

    advanceTimers();

    expect(getByText(/Connect Device/i)).toBeVisible();
  });

  it("should display generic error when a Backend error occurs", async () => {
    server.use(http.get("https://dada.api.ledger.com/v1/assets", () => HttpResponse.error()));
    const { getByText, user } = render(<ModularDrawerSharedNavigator />);
    advanceTimers();

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    expect(
      await screen.findByText(/Something went wrong on our end\. Please try again later/i),
    ).toBeVisible();
  });

  it("should display generic error when an internet error occurs", async () => {
    const { getByText, user } = render(<ModularDrawerSharedNavigator />);

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

    jest.mocked(useNetInfo).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      type: NetInfoStateType.none,
      details: null,
    });

    advanceTimers();

    expect(getByText(/No internet connection. Please try again/i)).toBeVisible();
  });
});
