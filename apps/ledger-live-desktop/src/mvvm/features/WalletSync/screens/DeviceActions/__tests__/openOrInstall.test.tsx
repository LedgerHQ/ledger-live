import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
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
});
