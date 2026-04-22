import React from "react";
import { render, screen } from "@tests/test-renderer";
import MyWalletNavigator from "../Navigator";
import { useMyWalletHeaderViewModel } from "../views/Header/useMyWalletHeaderViewModel";

jest.mock("../views/Header/useMyWalletHeaderViewModel");

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);

const mockOnNotificationsPress = jest.fn();
const mockOnSettingsPress = jest.fn();

function renderScreen(vmOverrides: Partial<ReturnType<typeof useMyWalletHeaderViewModel>> = {}) {
  mockedViewModel.mockReturnValue({
    onBackPress: jest.fn(),
    onNotificationsPress: mockOnNotificationsPress,
    onSettingsPress: mockOnSettingsPress,
    hasUnreadNotifications: false,
    ...vmOverrides,
  });
  return render(<MyWalletNavigator />);
}

describe("MyWalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the header and handle trailing button presses", async () => {
    const { user } = renderScreen();

    expect(screen.getByTestId("navigation-header-back-button")).toBeVisible();
    expect(screen.getByTestId("my-wallet-header-notifications-button")).toBeVisible();
    expect(screen.getByTestId("my-wallet-header-settings-button")).toBeVisible();

    await user.press(screen.getByTestId("my-wallet-header-notifications-button"));
    expect(mockOnNotificationsPress).toHaveBeenCalledTimes(1);

    await user.press(screen.getByTestId("my-wallet-header-settings-button"));
    expect(mockOnSettingsPress).toHaveBeenCalledTimes(1);
  });

  it("should render the bell-notification icon when there are unread notifications", () => {
    renderScreen({ hasUnreadNotifications: true });
    expect(screen.getByTestId("my-wallet-header-notifications-button")).toBeVisible();
  });

  it("should render the profile section with avatar and title", () => {
    renderScreen();
    expect(screen.getByTestId("my-wallet-avatar")).toBeVisible();
    expect(screen.getByTestId("my-wallet-profile-title")).toBeVisible();
  });

  it("should render the quick actions row with all action buttons", () => {
    renderScreen();

    expect(screen.getByTestId("my-wallet-quick-actions-row")).toBeVisible();
    expect(screen.getByLabelText("Backup")).toBeVisible();
    expect(screen.getByLabelText("Help")).toBeVisible();
    expect(screen.getByLabelText("Referral")).toBeVisible();
  });
});
