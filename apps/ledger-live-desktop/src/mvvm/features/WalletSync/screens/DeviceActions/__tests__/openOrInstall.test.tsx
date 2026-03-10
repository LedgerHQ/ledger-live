import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import OpenOrInstallTrustChainApp from "../openOrInstall";

const mockGoNext = jest.fn();

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

  it("renders DeviceAction", () => {
    render(<OpenOrInstallTrustChainApp goNext={mockGoNext} />);

    expect(screen.getByTestId("device-action")).toBeInTheDocument();
  });
});
