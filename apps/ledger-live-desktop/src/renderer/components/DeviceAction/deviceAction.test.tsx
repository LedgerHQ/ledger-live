import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { account } from "LLD/features/Collectibles/__integration__/mocks/mockedAccount";
import { DeviceDeprecationRules } from "@ledgerhq/live-common/hw/connectApp";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DmkError } from "@ledgerhq/live-dmk-desktop";

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
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.getByTestId("dismiss-disclaimer")).toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.queryByTestId("dismiss-disclaimer")).not.toBeInTheDocument();

    fireEvent.click(continueButton);
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
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.getByTestId("dismiss-disclaimer")).toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
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
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    screen.debug();

    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.queryByTestId("dismiss-disclaimer")).not.toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
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
        request={{ account }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    screen.debug();

    expect(screen.queryByText(/deprecated/i)).not.toBeInTheDocument();
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
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account, tokenCurrency: { name: "someToken" } }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should display Error Screen", () => {
    const device: Device = {
      modelId: DeviceModelId.nanoS,
      deviceId: "nanoS",
      wired: true,
    };
    const err: DmkError = {
      message: "device-deprecation",
      _tag: "DeviceDeprecationError",
    };
    const mockAction = {
      useHook: jest.fn(() => ({
        deviceDeprecationRules: null,
        error: err,
        displayDeprecateWarning: false,
        device: device,
      })),
      mapResult: jest.fn(),
    };

    render(
      <DeviceAction
        action={mockAction}
        request={{ account }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );
    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.queryByTestId("dismiss-disclaimer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("warning-deprecation-continue")).not.toBeInTheDocument();
  });
});
