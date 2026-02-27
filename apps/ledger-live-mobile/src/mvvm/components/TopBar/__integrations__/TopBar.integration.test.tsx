import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import { expectedNavigationParams } from "../const";
import { TopBar } from "../index";
import { track } from "~/analytics";
import { ScreenName } from "~/const/navigation";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
describe("TopBar navigation", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("should navigate to MyLedger with expected params when myLedger button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />);

    await user.press(getByTestId("topbar-myledger"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.myLedger.name,
      expectedNavigationParams.myLedger.params,
    );

    expect(track).toHaveBeenCalledWith("menuentry_clicked", {
      button: "MyLedger",
      page: ScreenName.Portfolio,
    });
  });

  it("should navigate to Discover with expected params when discover button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />);

    await user.press(getByTestId("topbar-discover"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.discover.name,
      expectedNavigationParams.discover.params,
    );

    expect(track).toHaveBeenCalledWith("menuentry_clicked", {
      button: "Discover",
      page: ScreenName.Portfolio,
    });
  });

  it("should navigate to NotificationCenter with expected params when notifications button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />);

    await user.press(getByTestId("topbar-notifications"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.notifications.name,
      expectedNavigationParams.notifications.params,
    );

    expect(track).toHaveBeenCalledWith("menuentry_clicked", {
      button: "Notifications",
      page: ScreenName.Portfolio,
    });
  });

  it("should navigate to Settings with expected params when settings button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />);

    await user.press(getByTestId("topbar-settings"));

    expect(mockNavigate).toHaveBeenCalledWith(expectedNavigationParams.settings.name);

    expect(track).toHaveBeenCalledWith("menuentry_clicked", {
      button: "Settings",
    });
  });

  it("should show sync button and open drawer with account names when user has accounts and presses sync", async () => {
    const minimalAccount = {
      id: "mock-account",
      type: "Account" as const,
      currency: { ticker: "BTC", id: "bitcoin", blockAvgTime: 60 },
      lastSyncDate: new Date(),
    };
    const stateWithAccounts = (state: import("~/reducers/types").State) => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: [minimalAccount],
      },
    });
    const { user, getByTestId, getByText } = renderWithReactQuery(<TopBar />, {
      overrideInitialState: stateWithAccounts,
    });

    await user.press(getByTestId("topbar-sync"));

    expect(getByText("Sync Error")).toBeOnTheScreen();
  });
});
