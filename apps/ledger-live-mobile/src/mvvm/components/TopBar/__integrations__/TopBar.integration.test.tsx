import React from "react";
import {
  renderWithReactQuery,
  withReadOnlyDisabled,
  withFlagOverrides,
} from "@tests/test-renderer";
import { expectedNavigationParams } from "../const";
import { TopBar } from "../index";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
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
  errorCurrencyIds: [],
};

describe("TopBar navigation", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockedUseSyncIndicator.mockReturnValue(defaultSyncState);
  });

  it("should navigate to MyLedger with expected params when myLedger button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />, {
      overrideInitialState: withReadOnlyDisabled,
    });

    await user.press(getByTestId("topbar-myledger"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expectedNavigationParams.myLedger.name,
      expectedNavigationParams.myLedger.params,
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
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

    expect(track).toHaveBeenCalledWith("button_clicked", {
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

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Notifications",
      page: ScreenName.Portfolio,
    });
  });

  it("should navigate to Settings with expected params when settings button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />);

    await user.press(getByTestId("topbar-settings"));

    expect(mockNavigate).toHaveBeenCalledWith(expectedNavigationParams.settings.name);

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Settings",
      page: ScreenName.Portfolio,
    });
  });

  it("should not render the search icon when asset discoverability is disabled", () => {
    const { queryByTestId } = renderWithReactQuery(<TopBar />);

    expect(queryByTestId("topbar-search")).toBeNull();
  });

  it("should navigate to GlobalSearch when the search icon is pressed and asset discoverability is enabled", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />, {
      overrideInitialState: withFlagOverrides({
        lwmWallet40: { enabled: true, params: { assetDiscoverability: true } },
      }),
    });

    await user.press(getByTestId("topbar-search"));

    expect(mockNavigate).toHaveBeenCalledWith(expectedNavigationParams.search.name);

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Search",
      page: ScreenName.Portfolio,
    });
  });

  it("should navigate to operations list with expected params when transaction history button is pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBar />, {
      overrideInitialState: withFlagOverrides({
        lwmWallet40: { enabled: true, params: { operationsList: true } },
      }),
    });

    await user.press(getByTestId("topbar-transaction-history"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
    });

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "operation_list",
      page: ScreenName.Portfolio,
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
