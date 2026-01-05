import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PendingOperation } from "./PendingOperation";

const mockTryTriggerPushNotificationDrawerAfterAction = jest.fn();

jest.mock("~/logic/notifications", () => ({
  useNotifications: () => ({
    tryTriggerPushNotificationDrawerAfterAction: mockTryTriggerPushNotificationDrawerAfterAction,
  }),
}));

jest.mock("../LiveApp/hooks/useSyncAllAccounts", () => ({
  useSyncAllAccounts: () => jest.fn(),
}));

const mockNavigation = {
  dispatch: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockSwapOperation = {
  swapId: "swap-123",
  provider: "changelly",
  toCurrency: { id: "ethereum", name: "Ethereum" },
  fromCurrency: { id: "bitcoin", name: "Bitcoin" },
};

const setup = () => {
  const mockRoute = {
    params: {
      swapOperation: mockSwapOperation,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return render(<PendingOperation navigation={mockNavigation} route={mockRoute} />);
};

describe("Swap PendingOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the swap success screen", () => {
    setup();
    expect(screen.getByTestId("swap-success-title")).toBeTruthy();
  });

  it("should trigger push notification drawer after action with 'swap'", () => {
    setup();
    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("swap");
    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledTimes(1);
  });
});

