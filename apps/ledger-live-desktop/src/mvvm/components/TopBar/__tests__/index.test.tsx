import React from "react";
import { render, screen } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import TopBar from "../index";

jest.mock("@braze/web-sdk", () => ({
  getCachedContentCards: () => ({ cards: [] }),
  initialize: () => true,
  changeUser: () => {},
  requestContentCardsRefresh: () => {},
  subscribeToContentCardsUpdates: () => () => {},
  automaticallyShowInAppMessages: () => {},
  openSession: () => {},
  logCardDismissal: () => {},
  logContentCardClick: () => {},
}));

describe("TopBar", () => {
  const getDefaultInitialState = (overrides = {}) => ({
    application: { hasPassword: false },
    accounts: [],
    devices: { currentDevice: null, devices: [] },
    dynamicContent: {
      desktopCards: [],
      portfolioCards: [],
      actionCards: [],
      notificationsCards: [],
    },
    settings: {
      discreetMode: false,
      vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
      devicesModelList: [],
      anonymousUserNotifications: {},
    },
    ...overrides,
  });

  it("renders ActivityIndicator when hasAccounts is true", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState({
        accounts: [
          {
            id: "account1",
            balance: { toString: () => "0" },
            swapHistory: [],
            lastSyncDate: new Date(),
            currency: {
              id: "bitcoin",
              type: "CryptoCurrency",
              ticker: "BTC",
              name: "Bitcoin",
              family: "bitcoin",
              blockAvgTime: 10 * 60,
            },
          },
        ],
      }),
    });

    expect(screen.getByTestId("topbar-synchronize-button")).toBeVisible();
  });

  it("does not render ActivityIndicator when hasAccounts is false", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState(),
    });

    expect(screen.queryByTestId("topbar-synchronize-button")).toBeNull();
  });

  it("renders lock button when hasPassword is true", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState({
        application: { hasPassword: true },
      }),
    });

    expect(screen.getByTestId("topbar-password-lock-button")).toBeVisible();
  });

  it("does not render lock button when hasPassword is false", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState(),
    });

    expect(screen.queryByTestId("topbar-password-lock-button")).toBeNull();
  });

  it("renders all elements when hasAccounts and hasPassword are true", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState({
        application: { hasPassword: true },
        accounts: [
          {
            id: "account1",
            balance: { toString: () => "0" },
            swapHistory: [],
            lastSyncDate: new Date(),
            currency: {
              id: "bitcoin",
              type: "CryptoCurrency",
              ticker: "BTC",
              name: "Bitcoin",
              family: "bitcoin",
              blockAvgTime: 10 * 60,
            },
          },
        ],
      }),
    });

    expect(screen.getByTestId("topbar-synchronize-button")).toBeVisible();
    expect(screen.getByTestId("topbar-password-lock-button")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-discreet")).toBeVisible();
    expect(screen.getByTestId("topbar-help-button")).toBeVisible();
    expect(screen.getByTestId("topbar-settings-button")).toBeVisible();
  });

  describe("discreetMode", () => {
    it("toggles discreetMode when clicking the button", async () => {
      const user = userEvent.setup();
      const { store } = render(<TopBar />, {
        initialState: getDefaultInitialState(),
      });

      const discreetButton = screen.getByTestId("topbar-action-button-discreet");
      expect(discreetButton).toBeVisible();
      expect(store.getState().settings.discreetMode).toBe(false);

      await user.click(discreetButton);
      expect(store.getState().settings.discreetMode).toBe(true);

      await user.click(discreetButton);
      expect(store.getState().settings.discreetMode).toBe(false);
    });
  });
});
