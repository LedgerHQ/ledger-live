import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";

import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { account } from "LLD/features/Collectibles/__integration__/mocks/mockedAccount";

describe("DeviceAction - Deprecation", () => {
  it("should render deprecation warning when deprecate and deprecateData are provided", () => {
    const mockOnContinue = jest.fn();
    const deprecateData = {
      productName: "Ledger Nano S",
      warningScreenVisible: true,
      clearSigningScreenVisible: false,
      warningScreenExceptions: {
        tokenExceptions: [],
        deprecatedFlowExceptions: [],
      },
      date: new Date("2023-12-31"),
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
        onContinue: mockOnContinue,
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

    expect(screen.getByTestId("warning-deprecation")).toBeInTheDocument();

    const continueButton = screen.getByTestId("warning-deprecation-continue");
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should not render deprecation warning if deprecate is false", () => {
    const mockAction = {
      useHook: jest.fn(() => ({
        deprecate: false,
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
    const deprecateData = {
      productName: "Ledger Nano S",
      deprecatedFlowExceptions: ["someFlow"],
      tokenExceptions: ["someToken"],
      date: new Date("2023-12-31"),
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecateData,
        onContinue: mockOnContinue,
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
});
