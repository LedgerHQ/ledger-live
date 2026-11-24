import React from "react";
import { render, screen } from "tests/testSetup";
import StepRemoveConnectDevice from "./StepRemoveConnectDevice";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";

jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => <div data-testid="generic-step-connect-device" />,
}));

const limitZero =
  "Your device will show a trust limit of 0. That's how the XRP Ledger removes a token.";

describe("StepRemoveConnectDevice", () => {
  it("tells an IOU holder the device shows a trust limit of 0", () => {
    render(
      <StepRemoveConnectDevice {...makeStepProps({ action: "remove", token: xrpIouToken })} />,
    );

    expect(screen.getByText(limitZero)).toBeVisible();
    expect(screen.getByTestId("generic-step-connect-device")).toBeInTheDocument();
  });

  it("says nothing about a trust limit for an MPT", () => {
    render(
      <StepRemoveConnectDevice {...makeStepProps({ action: "remove", token: xrpMptToken })} />,
    );

    expect(screen.queryByText(limitZero)).toBeNull();
    expect(screen.getByTestId("generic-step-connect-device")).toBeInTheDocument();
  });
});
