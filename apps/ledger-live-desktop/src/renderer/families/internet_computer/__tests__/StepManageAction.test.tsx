import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeHealthyNeuron, makeStepProps } from "./testUtils";

// The real one drives a DeviceAction against hardware; all this suite needs to know is whether the
// step got as far as rendering it.
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => <div data-testid="step-device" />,
}));

import StepManageAction from "../neuronFlow/StepManageAction";

const NEURON = makeHealthyNeuron({ id: 7n });

// The bridge's own class, reconstructed: the desktop app never imports these, it only renders them
// through TranslatedError, which resolves the copy by name.
const refusal = () =>
  Object.assign(new Error("ICPStakeMaturityNotAllowed"), {
    name: "ICPStakeMaturityNotAllowed",
  });

const renderStep = (overrides = {}) => {
  const props = makeStepProps({
    neurons: [NEURON],
    selectedNeuronId: "7",
    ...overrides,
  });
  return { props, ...render(<StepManageAction {...props} backTo="manage" />) };
};

const withError = (error: Error) => ({
  status: { errors: { transaction: error }, warnings: {}, amount: new BigNumber(0) },
});

describe("StepManageAction", () => {
  it("hands the transaction to the device when nothing objects to it", () => {
    renderStep();

    expect(screen.getByTestId("step-device")).toBeInTheDocument();
  });

  // The actions that go straight from a button to the device answer to no footer, so this is the
  // only thing standing between a snapshot that changed and a refusal from the canister.
  it("reports the bridge's refusal instead of asking for a signature", () => {
    renderStep(withError(refusal()));

    expect(screen.queryByTestId("step-device")).not.toBeInTheDocument();
    expect(screen.getByText("Cannot stake this neuron's maturity")).toBeInTheDocument();
  });

  it("sends the user back to the step the flow came from", async () => {
    const { props, user } = renderStep(withError(refusal()));

    await user.click(screen.getByText("Back"));

    expect(props.transitionTo).toHaveBeenCalledWith("manage");
  });

  // A pending status still describes the previous transaction, so deciding on it would put a banner
  // over a device step that is about to be fine.
  it("waits rather than ruling on a status the bridge is still recomputing", () => {
    renderStep({ ...withError(refusal()), bridgePending: true });

    expect(screen.getByTestId("step-device")).toBeInTheDocument();
  });

  it("explains a neuron that left the snapshot rather than signing against it", () => {
    renderStep({ neurons: [], selectedNeuronId: "7" });

    expect(screen.queryByTestId("step-device")).not.toBeInTheDocument();
    expect(screen.getByText(/no longer in your synced snapshot/)).toBeInTheDocument();
  });
});
