import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { DeviceDeprecationRules } from "@ledgerhq/live-common/hw/connectApp";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DmkError } from "@ledgerhq/live-dmk-desktop";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";

const ethereumCurrency = getCryptoCurrencyById("ethereum");
const ETH_ACCOUNT = genAccount("ethereum-1", {
  currency: ethereumCurrency,
});

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
        request={{ account: ETH_ACCOUNT }}
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    expect(
      screen.getByText(
        "As of 12/31/2023, Ethereum support on Ledger Nano S™ via Ledger Live™ will end",
      ),
    ).toBeVisible();
    expect(screen.getByText("Continue")).toBeVisible();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);
    expect(screen.getByText("Ledger Nano S™ can not Clear Sign this transaction")).toBeVisible();
    expect(screen.getByText("Proceed at your own risk")).toBeVisible();

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
        request={{ account: ETH_ACCOUNT }}
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    expect(
      screen.getByText(
        "As of 12/31/2023, Ethereum support on Ledger Nano S™ via Ledger Live™ will end",
      ),
    ).toBeVisible();
    expect(screen.getByText("Continue")).toBeVisible();

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
        request={{ account: ETH_ACCOUNT }}
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />,
    );

    expect(screen.getByText("Ledger Nano S™ can not Clear Sign this transaction")).toBeVisible();
    expect(screen.getByText("Proceed at your own risk")).toBeVisible();

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
        request={{ account: ETH_ACCOUNT }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    expect(screen.queryByText("Ledger Nano S™")).toBeNull();
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
        request={{ account: ETH_ACCOUNT, tokenCurrency: { name: "someToken" } }}
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
        request={{ account: ETH_ACCOUNT }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );
    expect(screen.getByText("Ledger Nano S™ does not support this feature")).toBeVisible();
  });
});
