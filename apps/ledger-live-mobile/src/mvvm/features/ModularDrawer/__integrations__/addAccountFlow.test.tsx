import React from "react";
import { act, render, waitFor } from "@tests/test-renderer";
import { ModularDrawerSharedNavigator, WITH_ACCOUNT_SELECTION } from "./shared";
import { BTC_ACCOUNT } from "@ledgerhq/live-common/modularDrawer/__mocks__/accounts.mock";
import { Account } from "@ledgerhq/types-live";
import { of, Observable } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { IsDeviceLockedResultType } from "~/hooks/useIsDeviceLockedPolling/types";

// Needed for receive navigator
jest.mock("@ledgerhq/live-config/LiveConfig", () => {
  const mockConfig = { mock: { type: "string", default: "test" } };
  return {
    LiveConfig: {
      instance: {
        config: mockConfig,
        provider: {
          getValueByKey: jest.fn(),
        },
      },
      getValueByKey: jest.fn((key: string) => {
        if (key === "config_currency") {
          return { checkSanctionedAddress: false };
        } else if (key.startsWith("config_currency_")) {
          return {};
        } else if (key === "tmp_sanctioned_addresses") {
          return [];
        }
        return undefined;
      }),
      setConfig: jest.fn(),
      setProvider: jest.fn(),
      setAppinfo: jest.fn(),
      isConfigSet: jest.fn(() => true),
    },
  };
});

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

jest.mock("@ledgerhq/live-common/hw/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn((_filter?: (module: { id: string }) => boolean) => {
    const deviceEvent = {
      type: "add" as const,
      id: "usb|1",
      name: "Ledger Stax",
      deviceModel: { id: DeviceModelId.stax },
      wired: true,
    };
    return of(deviceEvent);
  }),
}));

jest.mock("~/hooks/deviceActions", () => ({
  __esModule: true,
  useAppDeviceAction: () => {
    const device = { modelId: "stax" as const, deviceId: "usb|1" };
    const appAndVersion = { name: "Bitcoin", version: "1.0.0" };
    return {
      useHook: () => ({
        device,
        isLocked: false,
        opened: true,
        appAndVersion,
      }),
      mapResult: () => ({
        device,
        appAndVersion,
      }),
    };
  },
}));

jest.mock("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling", () => {
  return {
    ...jest.requireActual("~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling"),
    useIsDeviceLockedPolling: () => {
      return { result: { type: IsDeviceLockedResultType.unlocked }, retry: jest.fn() };
    },
  };
});

let triggerNext: (accounts: Account[]) => void = () => null;
let triggerComplete: () => void = () => null;
let triggerError: ((error: Error) => void) | null = null;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getCurrencyBridge: () => ({
    scanAccounts: () =>
      new Observable<{ account: Account }>(subscriber => {
        const originalNext = triggerNext;
        const originalComplete = triggerComplete;
        const originalError = triggerError;
        triggerNext = (accounts: Account[]) => {
          accounts.forEach(account => subscriber.next({ account }));
        };
        triggerComplete = () => {
          subscriber.complete();
        };
        triggerError = (error: Error) => {
          subscriber.error(error);
        };
        return () => {
          triggerNext = originalNext;
          triggerComplete = originalComplete;
          triggerError = originalError;
        };
      }),
    preload: () => Promise.resolve(true),
    hydrate: () => true,
  }),
}));

const mockScanAccountsSubscription = async (accounts: Account[]) => {
  for (let i = 0; i < accounts.length; i++) {
    await act(() => triggerNext(accounts.slice(0, i + 1)));
  }
  await act(() => triggerComplete());
};

const mockUseAcceptedCurrency = jest.fn(() => () => true);

const advanceTimers = () => {
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

describe("AddAccountFlow with MAD", () => {
  it("should do the add account flow then go back to the previous screen", async () => {
    const { getByText, queryByText, user } = render(
      <ModularDrawerSharedNavigator flow="add_account" />,
    );
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();
    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();
    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();
    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });
    await mockScanAccountsSubscription([BTC_ACCOUNT]);
    expect(getByText(/we found 1 account/i)).toBeVisible();
    await user.press(getByText(/confirm/i));
    expect(getByText(/account added to your portfolio/i)).toBeVisible();
    await user.press(getByText(/close/i));
    expect(queryByText(/account added to your portfolio/i)).not.toBeVisible();
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
  });

  it("should do the add account flow and go back to the previous screen automatically", async () => {
    const { getByText, user, queryByText } = render(
      <ModularDrawerSharedNavigator flow="not_add_account" />,
    );
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();
    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();
    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();
    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });
    await mockScanAccountsSubscription([BTC_ACCOUNT]);
    expect(getByText(/we found 1 account/i)).toBeVisible();
    await user.press(getByText(/confirm/i));
    expect(queryByText(/account added to your portfolio/i)).not.toBeVisible();
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
  });

  it("should do the add account flow then add funds actions", async () => {
    const { getByText, getByTestId, user } = render(
      <ModularDrawerSharedNavigator flow="add_account" />,
    );
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();
    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });
    await mockScanAccountsSubscription([BTC_ACCOUNT]);
    expect(getByText(/we found 1 account/i)).toBeVisible();
    await user.press(getByText(/confirm/i));
    await user.press(getByText(/add funds to my account/i));
    await user.press(getByText(/receive crypto from another wallet/i));
    expect(getByText(/receive BTC/i)).toBeVisible();
    await user.press(getByTestId(/NavigationHeaderCloseButton/i));
    expect(getByText(/add funds to my account/i)).toBeVisible();
  });

  it("should return to device selection on retry when device is locked in inline flow", async () => {
    const { user, getByText, queryByText, getByTestId } = render(
      <ModularDrawerSharedNavigator flow="not_add_account" />,
    );

    // Navigate through the add account flow
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();

    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();

    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();

    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();

    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();

    // Wait for scanning to start
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });

    // Trigger device locked error
    await act(() => {
      triggerError?.(new Error("Device locked"));
    });

    // Wait for error modal to appear
    await waitFor(() => {
      expect(queryByText("Device locked")).toBeVisible();
    });

    // Click Retry button (only Retry has testID="proceed-button", not Cancel)
    const retryButton = getByTestId("proceed-button");
    await user.press(retryButton);

    // Should return to device selection screen (not to wallet)
    await waitFor(() => {
      expect(getByText(/connect device/i)).toBeVisible();
      expect(queryByText(/checking the blockchain/i)).not.toBeVisible();
    });
  });

  it("should close flow and return to initial screen when clicking X button on error modal in inline flow", async () => {
    const { user, getByText, queryByText, getByTestId } = render(
      <ModularDrawerSharedNavigator flow="not_add_account" />,
    );

    // Navigate through the add account flow
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();

    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();

    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();

    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();

    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();

    // Wait for scanning to start
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });

    // Trigger device locked error
    await act(() => {
      triggerError?.(new Error("Device locked"));
    });

    // Wait for error modal to appear
    await waitFor(() => {
      expect(queryByText("Device locked")).toBeVisible();
    });

    // Click X button to close error modal - should close entire flow
    const closeButton = getByTestId("modal-close-button");
    await user.press(closeButton);

    // Should close the entire flow and return to the initial screen
    await waitFor(() => {
      expect(queryByText(/checking the blockchain/i)).not.toBeVisible();
      expect(queryByText(/connect device/i)).not.toBeVisible();
      expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    });
  });

  it("should close flow and return to device selection when clicking X button on error modal in non-inline flow", async () => {
    const { user, getByText, queryByText, getByTestId } = render(
      <ModularDrawerSharedNavigator flow="add_account" />,
    );

    // Navigate through the add account flow
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();

    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();

    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();

    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();

    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();

    // Wait for scanning to start
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });

    // Trigger device locked error
    await act(() => {
      triggerError?.(new Error("Device locked"));
    });

    // Wait for error modal to appear
    await waitFor(() => {
      expect(queryByText("Device locked")).toBeVisible();
    });

    // Click X button to close error modal - should close the flow
    const closeButton = getByTestId("modal-close-button");
    await user.press(closeButton);

    // For non-inline flows, should pop the navigation and return to device selection
    await waitFor(() => {
      expect(queryByText(/checking the blockchain/i)).not.toBeVisible();
      expect(queryByText("Device locked")).not.toBeVisible();
      expect(getByText(/connect device/i)).toBeVisible();
    });
  });

  it("should close inline flow and return to initial screen after account creation", async () => {
    const { user, getByText, queryByText } = render(
      <ModularDrawerSharedNavigator flow="not_add_account" />,
    );

    // Navigate through the add account flow
    expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    await user.press(getByText(WITH_ACCOUNT_SELECTION));
    advanceTimers();

    expect(getByText(/bitcoin/i)).toBeVisible();
    await user.press(getByText(/bitcoin/i));
    advanceTimers();

    expect(getByText(/add new or existing account/i)).toBeVisible();
    await user.press(getByText(/add new or existing account/i));
    advanceTimers();

    expect(getByText(/connect device/i)).toBeVisible();
    advanceTimers();

    const deviceItem = getByText(/ledger stax/i);
    expect(deviceItem).toBeVisible();
    await user.press(deviceItem);
    advanceTimers();

    // Wait for scanning to start
    await waitFor(() => {
      expect(getByText(/checking the blockchain/i)).toBeVisible();
    });

    // Complete scanning
    await mockScanAccountsSubscription([BTC_ACCOUNT]);
    expect(getByText(/we found 1 account/i)).toBeVisible();

    // Confirm account addition
    await user.press(getByText(/confirm/i));

    // Should close the entire flow and return to the initial screen
    await waitFor(() => {
      expect(queryByText(/checking the blockchain/i)).not.toBeVisible();
      expect(queryByText(/connect device/i)).not.toBeVisible();
      expect(getByText(WITH_ACCOUNT_SELECTION)).toBeVisible();
    });
  });
});
