import React from "react";
import { screen, render } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ViewKeyWarningScreen from "../ViewKeyWarningScreen";
import { aleoCurrency } from "../../__mocks__/currency.mock";

// Capture onClose/onModalHide so each test can trigger them directly instead of
// simulating the drawer's close animation via hooks.
let capturedOnClose: (() => void) | undefined;
let capturedOnModalHide: (() => void) | undefined;

jest.mock("~/components/ConfirmationModal", () => {
  const { Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockConfirmationModal({
    isOpened,
    onClose,
    onConfirm,
    onModalHide,
  }: {
    isOpened: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    onModalHide?: () => void;
  }) {
    capturedOnClose = onClose;
    capturedOnModalHide = onModalHide;
    if (!isOpened) return null;
    return <Pressable testID="enabled-confirmation-modal-confirm-button" onPress={onConfirm} />;
  };
});

const mockParentNavigate = jest.fn();
const mockOnCloseNavigation = jest.fn();

const mockNavigation = {
  getParent: jest.fn(() => ({
    navigate: mockParentNavigate,
  })),
};

const mockRoute = {
  params: {
    currency: aleoCurrency,
    device: { deviceId: "device-1", modelId: "nanoX", wired: false },
    context: undefined,
    onCloseNavigation: mockOnCloseNavigation,
    navigationDepth: undefined,
    inline: undefined,
    returnToSwap: undefined,
    onSuccess: undefined,
    sourceScreenName: "SelectDevice",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderScreen = () =>
  render(<ViewKeyWarningScreen route={mockRoute as any} navigation={mockNavigation as any} />);

describe("ViewKeyWarningScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnClose = undefined;
    capturedOnModalHide = undefined;
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
      onCloseNavigation: mockOnCloseNavigation,
      navigationDepth: undefined,
      inline: undefined,
      returnToSwap: undefined,
      onSuccess: undefined,
      sourceScreenName: "SelectDevice",
    });
  });

  it("calls onCloseNavigation when Cancel is confirmed", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));
    await user.press(screen.getByTestId("enabled-confirmation-modal-confirm-button"));
    // Simulate the drawer's close animation completing.
    capturedOnModalHide?.();

    expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
  });

  it("still calls onCloseNavigation when the drawer re-invokes onClose before onModalHide", async () => {
    // QueuedDrawer fires onClose (sync) before onModalHide (animated); order matters here.
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));
    await user.press(screen.getByTestId("enabled-confirmation-modal-confirm-button"));
    capturedOnClose?.();
    capturedOnModalHide?.();

    expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
  });

  it("does not call onCloseNavigation when the modal is dismissed without confirming", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));
    capturedOnClose?.();
    capturedOnModalHide?.();

    expect(mockOnCloseNavigation).not.toHaveBeenCalled();
  });
});
