import type {
  ICPTransactionType,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import React from "react";
import { render, screen } from "tests/testSetup";
import StepConfirmation, {
  StepConfirmationFooter,
} from "../ManageNeuronFlowModal/steps/StepConfirmation";
import { makeStepProps } from "./testUtils";

const operation = {
  id: "op-1",
  accountId: "acc-1",
  type: "FEES",
  date: new Date(),
  extra: {},
} as unknown as InternetComputerOperation;

// Every operation the manage and refresh flows can actually reach the confirmation screen with.
// `send` and `create_neuron` run through MODAL_SEND instead, and spawn_neuron_from_maturity is not
// offered by any action.
const REACHABLE: ICPTransactionType[] = [
  "list_neurons",
  "start_dissolving",
  "stop_dissolving",
  "disburse",
  "set_dissolve_delay",
  "increase_dissolve_delay",
  "add_hot_key",
  "remove_hot_key",
  "follow",
  "refresh_voting_power",
  "stake_maturity",
  "auto_stake_maturity",
  "spawn_neuron",
  "split_neuron",
  "increase_stake",
];

const renderConfirmation = (overrides = {}) =>
  render(<StepConfirmation {...makeStepProps({ optimisticOperation: operation, ...overrides })} />);

describe("StepConfirmation", () => {
  it("renders nothing before the operation is broadcast", () => {
    const { container } = render(<StepConfirmation {...makeStepProps()} />);

    expect(container.firstChild).toBeNull();
  });

  it("confirms success once an operation has broadcast", () => {
    renderConfirmation({ lastAction: "start_dissolving" });

    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  // The copy is keyed off lastAction and falls back to generic wording rather than erroring, so a
  // missing key would be silent. Distinctness is what proves every key resolved.
  it.each(REACHABLE)("has its own confirmation wording for %s", action => {
    const { container } = renderConfirmation({ lastAction: action });
    const text = container.textContent ?? "";

    expect(text).not.toContain("internetComputer.");
    expect(text).not.toContain("Your neuron has been updated.");
  });

  it("gives all reachable operations distinct wording", () => {
    const wordings = REACHABLE.map(action => {
      const { container, unmount } = renderConfirmation({ lastAction: action });
      const text = container.textContent ?? "";
      unmount();
      return text;
    });

    expect(new Set(wordings).size).toBe(REACHABLE.length);
  });

  it("falls back to generic wording when no operation was recorded", () => {
    const { container } = renderConfirmation({ lastAction: null });

    expect(container.textContent).toContain("Your neuron has been updated.");
  });

  it("shows the error instead when the flow failed", () => {
    render(<StepConfirmation {...makeStepProps({ error: new Error("boom") })} />);

    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  // A signed-then-failed operation may still land, so the user is warned rather than told it failed.
  it("adds the broadcast disclaimer when the failure came after signing", () => {
    const { container } = render(
      <StepConfirmation {...makeStepProps({ error: new Error("boom"), signed: true })} />,
    );

    expect(container.textContent).toContain("signed");
  });
});

describe("StepConfirmationFooter", () => {
  it("offers a way back to the neuron list after a success", async () => {
    const props = makeStepProps({ optimisticOperation: operation });
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByTestId("icp-back-to-neurons-button"));

    expect(props.transitionTo).toHaveBeenCalledWith("listNeuron");
  });

  it("offers a retry after a failure, returning to the signing step", async () => {
    const props = makeStepProps({ error: new Error("boom") });
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByText("Retry"));

    expect(props.onRetry).toHaveBeenCalled();
    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });

  it("offers neither once the flow has neither succeeded nor failed", () => {
    render(<StepConfirmationFooter {...makeStepProps()} />);

    expect(screen.queryByTestId("icp-back-to-neurons-button")).not.toBeInTheDocument();
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });
});
