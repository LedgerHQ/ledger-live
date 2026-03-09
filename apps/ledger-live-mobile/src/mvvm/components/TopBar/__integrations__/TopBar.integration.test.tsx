import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import { expectedNavigationParams } from "../const";
import { TopBar } from "../index";
import { track } from "~/analytics";
import { ScreenName } from "~/const/navigation";
import { useSyncIndicator } from "../hooks/useSyncIndicator";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../hooks/useSyncIndicator");
jest.mock("../components/SyncErrorBottomSheet", () => ({
  SyncErrorBottomSheet: () => null,
}));

const mockedUseSyncIndicator = jest.mocked(useSyncIndicator);

const defaultSyncState = {
  hasAccounts: false,
  isError: false,
  isPending: false,
  listOfErrorAccountNames: "",
  syncAccessibilityLabel: "Synchronize",
};

describe("TopBar navigation", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockedUseSyncIndicator.mockReturnValue(defaultSyncState);
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
});

describe("TopBar sync indicator", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("should display sync error icon when accounts exist and sync has errors", () => {
    mockedUseSyncIndicator.mockReturnValue({
      ...defaultSyncState,
      hasAccounts: true,
      isError: true,
      listOfErrorAccountNames: "Bitcoin/Ethereum",
      syncAccessibilityLabel: "Sync error",
    });

    const { getByTestId } = renderWithReactQuery(<TopBar />);

    expect(getByTestId("topbar-sync")).toBeVisible();
  });

  it("should not display sync error icon when there are no accounts", () => {
    mockedUseSyncIndicator.mockReturnValue({
      ...defaultSyncState,
      hasAccounts: false,
      isError: true,
    });

    const { queryByTestId } = renderWithReactQuery(<TopBar />);

    expect(queryByTestId("topbar-sync")).toBeNull();
  });

  it("should not display sync error icon when there is no sync error", () => {
    mockedUseSyncIndicator.mockReturnValue({
      ...defaultSyncState,
      hasAccounts: true,
      isError: false,
    });

    const { queryByTestId } = renderWithReactQuery(<TopBar />);

    expect(queryByTestId("topbar-sync")).toBeNull();
  });
});
