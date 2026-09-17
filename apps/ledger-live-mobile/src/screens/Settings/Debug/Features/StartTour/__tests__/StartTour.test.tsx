import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import StartTour from "../index";

const navigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate }),
}));

jest.mock("../../../../SettingsNavigationScrollView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

describe("StartTour", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("should show Product Tour, Q2, and Q3 rows", () => {
    render(<StartTour />);

    expect(screen.getByText("Product Tour")).toBeVisible();
    expect(screen.getByText("Q2 Wallet V4 Tour (Images)")).toBeVisible();
    expect(screen.getByText("Q3 Wallet V4 Tour")).toBeVisible();
    expect(screen.queryByText("Wallet V4 Tour")).toBeNull();
  });

  it("should navigate to each tour debug screen", async () => {
    const { user } = render(<StartTour />);

    await user.press(screen.getByText("Product Tour"));
    expect(navigate).toHaveBeenCalledWith(ScreenName.DebugProductTour);

    await user.press(screen.getByText("Q2 Wallet V4 Tour (Images)"));
    expect(navigate).toHaveBeenCalledWith(ScreenName.DebugQ2WalletV4Tour);

    await user.press(screen.getByText("Q3 Wallet V4 Tour"));
    expect(navigate).toHaveBeenCalledWith(ScreenName.DebugQ3WalletV4Tour);
  });
});
