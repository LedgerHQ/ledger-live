import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import OpenOrInstallTrustChainApp from "../openOrInstall";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";

const mockGoNext = jest.fn();
const mockDispatch = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
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

  it("dispatches setOriginFlow(ledgerSync) on mount", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(mockDispatch).toHaveBeenCalledWith(setOriginFlow(HOOKS_TRACKING_LOCATIONS.ledgerSync));
  });

  it("renders DeviceAction", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(screen.getByTestId("device-action")).toBeInTheDocument();
  });
});
