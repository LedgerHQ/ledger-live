import React from "react";
import { screen, render } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ViewKeyWarningScreen from "../ViewKeyWarningScreen";

// Bypass animation issues: call onModalHide synchronously when the drawer closes.
jest.mock("LLM/components/QueuedDrawer", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactMock = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  function MockQueuedDrawer(props: Record<string, unknown>) {
    const prevOpen = ReactMock.useRef(props.isRequestingToBeOpened);
    ReactMock.useEffect(() => {
      if (prevOpen.current && !props.isRequestingToBeOpened && typeof props.onModalHide === "function") {
        (props.onModalHide as () => void)();
      }
      prevOpen.current = props.isRequestingToBeOpened;
    });
    if (!props.isRequestingToBeOpened) return ReactMock.createElement(View, null);
    return ReactMock.createElement(View, null, props.children);
  }
  return { __esModule: true, default: MockQueuedDrawer };
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
    currency: {
      type: "CryptoCurrency",
      id: "aleo",
      name: "Aleo",
      ticker: "ALEO",
      family: "aleo",
    },
    device: { deviceId: "device-1", modelId: "nanoX", wired: false },
    context: undefined,
    onCloseNavigation: mockOnCloseNavigation,
    navigationDepth: undefined,
    inline: undefined,
    returnToSwap: undefined,
    onSuccess: undefined,
  },
};

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
      onCloseNavigation: mockOnCloseNavigation,
      navigationDepth: undefined,
      inline: undefined,
      returnToSwap: undefined,
      onSuccess: undefined,
    });
  });

  it("calls onCloseNavigation when Cancel is confirmed", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Cancel"));
    await user.press(screen.getByTestId("enabled-confirmation-modal-confirm-button"));

    expect(mockOnCloseNavigation).toHaveBeenCalledTimes(1);
  });
});
