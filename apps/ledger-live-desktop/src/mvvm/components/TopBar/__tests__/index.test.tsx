import React from "react";
import BigNumber from "bignumber.js";
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

const mockBalance = new BigNumber(0);

const mockAccount = {
  id: "account1",
  balance: mockBalance,
  spendableBalance: mockBalance,
  swapHistory: [],
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  lastSyncDate: new Date(),
  currency: {
    id: "bitcoin",
    type: "CryptoCurrency",
    ticker: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    blockAvgTime: 10 * 60,
  },
};

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
        accounts: [mockAccount],
      }),
    });

    expect(screen.getByTestId("topbar-action-button-synchronize")).toBeVisible();
  });

  it("does not render ActivityIndicator when hasAccounts is false", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState(),
    });

    expect(screen.queryByTestId("topbar-action-button-synchronize")).toBeNull();
  });

  it("renders all slot actions and help when hasAccounts is true", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState({
        accounts: [mockAccount],
      }),
    });

    expect(screen.getByTestId("topbar-action-button-synchronize")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-notifications")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-discreet")).toBeVisible();
    expect(screen.getByTestId("topbar-help-button")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
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
