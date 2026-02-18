import React from "react";
import { render, screen } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import TopBar from "../index";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("~/renderer/families", () => ({
  getLLDCoinFamily: () => ({}),
}));

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

jest.mock("electron-store", () => {
  return jest.fn().mockImplementation(() => ({}));
});

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
        accounts: [BTC_ACCOUNT],
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

  it("renders all slot actions when hasAccounts is true", () => {
    render(<TopBar />, {
      initialState: getDefaultInitialState({
        accounts: [BTC_ACCOUNT],
      }),
    });

    expect(screen.getByTestId("topbar-action-button-my-ledger")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-synchronize")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-notifications")).toBeVisible();
    expect(screen.getByTestId("topbar-action-button-discreet")).toBeVisible();
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
