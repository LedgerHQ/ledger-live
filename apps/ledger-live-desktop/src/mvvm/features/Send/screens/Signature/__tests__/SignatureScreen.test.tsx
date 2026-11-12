import React from "react";
import { render, screen } from "tests/testSetup";
import { useFeature } from "@features/platform-feature-flags";
import { SignatureScreen } from "../SignatureScreen";

jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useFeature: jest.fn(),
}));
jest.mock("../SignatureDeviceActionScreen", () => ({
  SignatureDeviceActionScreen: () => <div data-testid="device-action-signature" />,
}));
jest.mock("../SignatureExecutorScreen", () => ({
  SignatureExecutorScreen: () => <div data-testid="executor-signature" />,
}));

describe("SignatureScreen", () => {
  it("signs through the device intent executor when lwdNewSendFlowDeviceIntent is on", () => {
    jest.mocked(useFeature).mockReturnValue({ enabled: true });

    render(<SignatureScreen />);

    expect(useFeature).toHaveBeenCalledWith("lwdNewSendFlowDeviceIntent");
    expect(screen.getByTestId("executor-signature")).toBeInTheDocument();
  });

  it("keeps the device action when lwdNewSendFlowDeviceIntent is off", () => {
    jest.mocked(useFeature).mockReturnValue({ enabled: false });

    render(<SignatureScreen />);

    expect(screen.getByTestId("device-action-signature")).toBeInTheDocument();
  });

  it("keeps the screen it started with when lwdNewSendFlowDeviceIntent changes", () => {
    jest.mocked(useFeature).mockReturnValue({ enabled: true });
    const { rerender } = render(<SignatureScreen />);

    jest.mocked(useFeature).mockReturnValue({ enabled: false });
    rerender(<SignatureScreen />);

    expect(screen.getByTestId("executor-signature")).toBeInTheDocument();
    expect(screen.queryByTestId("device-action-signature")).not.toBeInTheDocument();
  });
});
