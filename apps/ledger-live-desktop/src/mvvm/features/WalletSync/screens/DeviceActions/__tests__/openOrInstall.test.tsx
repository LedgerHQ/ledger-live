import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import OpenOrInstallTrustChainApp from "../openOrInstall";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import * as originFlow from "~/renderer/analytics/originFlow";

const mockGoNext = jest.fn();

jest.mock("~/renderer/analytics/originFlow", () => ({
  setOriginFlow: jest.fn(),
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action" />,
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({}),
}));

describe("OpenOrInstallTrustChainApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls setOriginFlow(ledgerSync) on mount", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(originFlow.setOriginFlow).toHaveBeenCalledWith(
      HOOKS_TRACKING_LOCATIONS.ledgerSync,
    );
  });

  it("renders DeviceAction", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(screen.getByTestId("device-action")).toBeInTheDocument();
  });
});
