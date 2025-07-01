import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { account } from "LLD/features/Collectibles/__integration__/mocks/mockedAccount";
import { DeviceDeprecation } from "@ledgerhq/live-common/hw/connectApp";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DmkError } from "@ledgerhq/live-dmk-desktop";

describe("DeviceAction - Deprecation", () => {
  it("should render deprecation warning and deprecation clear signing warning", () => {
    const mockOnContinue = jest.fn();
    const deprecateData = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: true,
      clearSigningScreenVisible: true,
      warningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
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
    const deprecateData = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: true,
      clearSigningScreenVisible: false,
      warningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
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

    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.getByTestId("dismiss-disclaimer")).toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should render deprecation clear signing warning only", () => {
    const mockOnContinue = jest.fn();
    const deprecateData = {
      modelId: DeviceModelId.nanoS,
      warningScreenVisible: false,
      clearSigningScreenVisible: true,
      warningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      errorScreenVisible: false,
      errorScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      clearSigningScreenConfig: {
        exception: [],
        deprecatedFlow: ["send", "receive"],
      },
      date: new Date("2023-12-31"),
      onContinue: mockOnContinue,
    };
    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
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

    expect(screen.getByTestId("warning-deprecation-title")).toBeInTheDocument();
    expect(screen.queryByTestId("dismiss-disclaimer")).not.toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should not render deprecation warning if deprecate is false", () => {
    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData: null,
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
    const deprecateData: DeviceDeprecation = {
      modelId: DeviceModelId.nanoS,
      date: new Date("2023-12-31"),
      warningScreenVisible: false,
      clearSigningScreenVisible: false,
      errorScreenVisible: false,
      warningScreenConfig: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      errorScreenConfig: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      clearSigningScreenConfig: {
        deprecatedFlow: ["send"],
        exception: [],
      },
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
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
        deprecateData: null,
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
