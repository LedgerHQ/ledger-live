import React from "react";
import { screen, render } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ViewKeyWarningScreen from "../ViewKeyWarningScreen";

const mockParentNavigate = jest.fn();
const mockParentGoBack = jest.fn();

const mockNavigation = {
  getParent: jest.fn(() => ({
    navigate: mockParentNavigate,
    goBack: mockParentGoBack,
  })),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderScreen = () =>
  render(<ViewKeyWarningScreen route={mockRoute as any} navigation={mockNavigation as any} />);

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

  it("calls parent goBack when Cancel is pressed", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));

    expect(mockParentGoBack).toHaveBeenCalledTimes(1);
  });
});
