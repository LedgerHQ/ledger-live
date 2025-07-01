import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import { DeviceDeprecationRules } from "@ledgerhq/live-common/hw/connectApp";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
const nanoS: Device = {
  modelId: DeviceModelId.nanoS,
  deviceId: "nanoS",
  wired: true,
};

const account = MockedAccounts.active[0];
describe("DeviceAction - Deprecation", () => {
  it("should render deprecation warning and deprecation clear signing warning", () => {
    const mockOnContinue = jest.fn();
    const deviceDeprecationRules: DeviceDeprecationRules = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: true,
      clearSigningScreenVisible: true,
      warningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account }}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.receiveFlow}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeTruthy();
    expect(screen.getByTestId("dismiss-disclaimer")).toBeTruthy();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.press(continueButton);

    screen.debug();
    expect(screen.getByTestId("warning-deprecation-title")).toBeTruthy();
    expect(screen.queryByTestId("dismiss-disclaimer")).toBeNull();

    fireEvent.press(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should render deprecation warning only", () => {
    const mockOnContinue = jest.fn();
    const deviceDeprecationRules: DeviceDeprecationRules = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: true,
      clearSigningScreenVisible: false,
      warningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account }}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.receiveFlow}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeTruthy();
    expect(screen.getByTestId("dismiss-disclaimer")).toBeTruthy();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.press(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should render deprecation clear signing warning only", () => {
    const mockOnContinue = jest.fn();
    const deviceDeprecationRules: DeviceDeprecationRules = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: false,
      clearSigningScreenVisible: true,
      warningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenRules: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account }}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.receiveFlow}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeTruthy();
    expect(screen.queryByTestId("dismiss-disclaimer")).toBeNull();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.press(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should not render deprecation warning if deprecate is false", () => {
    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules: null,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{}}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.sendFlow}
      />,
    );

    screen.debug();

    expect(screen.queryByText(/deprecated/i)).toBeNull();
  });

  it("should call onContinue immediately if skipDeprecation is true", () => {
    const mockOnContinue = jest.fn();
    const deviceDeprecationRules: DeviceDeprecationRules = {
      modelId: DeviceModelId.nanoS,
      date: new Date("2023-12-31"),
      warningScreenVisible: false,
      clearSigningScreenVisible: false,
      errorScreenVisible: false,
      warningScreenRules: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      errorScreenRules: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      clearSigningScreenRules: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules,
        displayDeprecateWarning: false,
        device: nanoS,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account, tokenCurrency: { name: "someToken" } }}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.sendFlow}
      />,
    );

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should display Error Screen", () => {
    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules: null,
        error: new Error("device-deprecation"),
        displayDeprecateWarning: false,
        device: nanoS,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account }}
        device={nanoS}
        location={HOOKS_TRACKING_LOCATIONS.sendFlow}
      />,
    );

    expect(screen.getByTestId("warning-deprecation-title")).toBeTruthy();
    expect(screen.queryByTestId("dismiss-disclaimer")).toBeNull();
    expect(screen.queryByTestId("warning-deprecation-continue")).toBeNull();
  });
});
