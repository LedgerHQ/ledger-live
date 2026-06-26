import React from "react";
import { screen, render } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ViewKeyWarningScreen from "../ViewKeyWarningScreen";

const mockParentNavigate = jest.fn();

const mockNavigation = {
  getParent: jest.fn(() => ({ navigate: mockParentNavigate })),
};

const mockRoute = {
  params: {
    currency: {
      type: "CryptoCurrency",
      id: "aleo",
      name: "Aleo",
      ticker: "ALEO",
      family: "aleo",
    },
    device: { deviceId: "device-1", modelId: "nanoX", wired: false },
    context: undefined,
    onCloseNavigation: undefined,
    navigationDepth: undefined,
    inline: undefined,
    returnToSwap: undefined,
    onSuccess: undefined,
  },
};

jest.mock("~/utils/urls", () => ({
  urls: {
    aleo: { learnMore: "https://support.ledger.com/article/Aleo-ALEO" },
  },
}));

const renderScreen = (onCloseNavigation?: () => void) => {
  const route = onCloseNavigation
    ? { ...mockRoute, params: { ...mockRoute.params, onCloseNavigation } }
    : mockRoute;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return render(<ViewKeyWarningScreen route={route as any} navigation={mockNavigation as any} />);
};

describe("ViewKeyWarningScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title", () => {
    renderScreen();
    expect(screen.getByText("Set up Aleo private balance")).toBeOnTheScreen();
  });

  it("renders the Allow and Cancel buttons", () => {
    renderScreen();
    expect(screen.getByText("Allow")).toBeOnTheScreen();
    expect(screen.getByText("Cancel")).toBeOnTheScreen();
  });

  it("navigates to ScanDeviceAccounts with route params when Allow is pressed", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Allow"));

    expect(mockParentNavigate).toHaveBeenCalledWith(ScreenName.ScanDeviceAccounts, {
      currency: expect.objectContaining({ id: "aleo" }),
      device: expect.objectContaining({ deviceId: "device-1" }),
      context: undefined,
      onCloseNavigation: undefined,
      navigationDepth: undefined,
      inline: undefined,
      returnToSwap: undefined,
      onSuccess: undefined,
    });
  });

  it("does nothing when Cancel is pressed and onCloseNavigation is not provided", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));

    // onCloseNavigation?.() is a no-op when undefined — button press doesn't crash
    expect(mockParentNavigate).not.toHaveBeenCalled();
  });

  it("calls onCloseNavigation when Cancel is pressed", async () => {
    const mockOnCloseNavigation = jest.fn();
    const { user } = renderScreen(mockOnCloseNavigation);

    await user.press(screen.getByText("Cancel"));

    expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
    expect(mockParentNavigate).not.toHaveBeenCalled();
  });
});
