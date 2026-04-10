import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { useMyWalletHeaderViewModel } from "../views/Header/useMyWalletHeaderViewModel";
import { MyWalletScreen } from "../index";

jest.mock("../views/Header/useMyWalletHeaderViewModel");

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);

const mockOnBackPress = jest.fn();
const mockOnNotificationsPress = jest.fn();
const mockOnSettingsPress = jest.fn();

function renderScreen(vmOverrides: Partial<ReturnType<typeof useMyWalletHeaderViewModel>> = {}) {
  mockedViewModel.mockReturnValue({
    onBackPress: mockOnBackPress,
    onNotificationsPress: mockOnNotificationsPress,
    onSettingsPress: mockOnSettingsPress,
    hasUnreadNotifications: false,
    ...vmOverrides,
  });
  return render(<MyWalletScreen />);
}

describe("MyWalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the header and handle all button presses", () => {
    renderScreen();

    expect(screen.getByTestId("my-wallet-header-back-button")).toBeVisible();
    expect(screen.getByTestId("my-wallet-header-notifications-button")).toBeVisible();
    expect(screen.getByTestId("my-wallet-header-settings-button")).toBeVisible();

    fireEvent.press(screen.getByTestId("my-wallet-header-back-button"));
    expect(mockOnBackPress).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("my-wallet-header-notifications-button"));
    expect(mockOnNotificationsPress).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("my-wallet-header-settings-button"));
    expect(mockOnSettingsPress).toHaveBeenCalledTimes(1);
  });

  it("should render the bell-notification icon when there are unread notifications", () => {
    renderScreen({ hasUnreadNotifications: true });
    expect(screen.getByTestId("my-wallet-header-notifications-button")).toBeVisible();
  });
});
