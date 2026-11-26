import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { getKeyRingDeviceInitialization } from "@features/platform-key-ring";
import OpenOrInstallTrustChainApp from "../openOrInstall";
import * as originFlow from "~/renderer/analytics/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

const mockGoNext = jest.fn();

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action" />,
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  getKeyRingDeviceInitialization: jest.fn(
    jest.requireActual("@features/platform-key-ring").getKeyRingDeviceInitialization,
  ),
}));

const mockSetOriginFlow = jest.mocked(originFlow.setOriginFlow);

describe("OpenOrInstallTrustChainApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders DeviceAction", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(screen.getByTestId("device-action")).toBeInTheDocument();
  });

  it("sets origin flow to Ledger Sync on mount", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(mockSetOriginFlow).toHaveBeenCalledWith(HOOKS_TRACKING_LOCATIONS.ledgerSync);
  });

  it("shows an error instead of the device action on an OS feature requirement", () => {
    jest
      .mocked(getKeyRingDeviceInitialization)
      .mockReturnValueOnce({ kind: "os-feature", feature: "lkrp", minimumOsVersion: "2.0.0" });

    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(screen.queryByTestId("device-action")).toBeNull();
    expect(mockGoNext).not.toHaveBeenCalled();
  });
});
