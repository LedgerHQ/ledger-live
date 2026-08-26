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

  // The modal stays open across actions and kept its last success, so a refusal on device after any
  // earlier success rendered "Done" — with the copy for the action that had just been refused.
  it("reports the failure rather than an earlier success in the same modal", () => {
    renderConfirmation({
      error: new Error("boom"),
      signed: true,
      lastAction: "stop_dissolving",
    });

    expect(screen.queryByText("Done")).not.toBeInTheDocument();
    expect(screen.queryByText("Your neuron has stopped dissolving.")).not.toBeInTheDocument();
  });

  // "signed but could not be sent" is a claim about delivery. Each of these errors IS the network's
  // own answer, so the request plainly did reach it.
  it.each(["ICPGovernanceRejected", "ICPCallRejected", "ICPCallUnconfirmed"])(
    "does not claim the request never reached the network for %s",
    name => {
      const error = Object.assign(new Error("boom"), { name });
      const { container } = render(
        <StepConfirmation {...makeStepProps({ error, signed: true })} />,
      );

      expect(container.textContent).not.toContain("could not be sent");
    },
  );
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

    expect(props.resetAttempt).toHaveBeenCalled();
    expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
  });

  it("offers neither once the flow has neither succeeded nor failed", () => {
    render(<StepConfirmationFooter {...makeStepProps()} />);

    expect(screen.queryByTestId("icp-back-to-neurons-button")).not.toBeInTheDocument();
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  // Retry beside a success action was the visible tell that both states were set at once.
  it("does not offer the success action beside Retry", () => {
    render(
      <StepConfirmationFooter
        {...makeStepProps({ optimisticOperation: operation, error: new Error("boom") })}
      />,
    );

    expect(screen.queryByTestId("icp-back-to-neurons-button")).not.toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});

describe("StepConfirmationFooter retry", () => {
  const failed = (lastAction: ICPTransactionType, name = "Error") =>
    makeStepProps({ error: Object.assign(new Error("boom"), { name }), lastAction });

  // Retry always went to the device step, so a value the user needed to correct could not be
  // corrected — the only option was re-signing the same transaction.
  it.each([
    ["add_hot_key", "addHotKey"],
    ["split_neuron", "splitNeuron"],
    ["stake_maturity", "stakeMaturity"],
    ["set_dissolve_delay", "setDissolveDelay"],
    ["increase_dissolve_delay", "setDissolveDelay"],
    ["follow", "selectFollowees"],
  ])("returns to the step that collected input for %s", async (action, step) => {
    const props = failed(action as ICPTransactionType);
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByText("Retry"));

    expect(props.transitionTo).toHaveBeenCalledWith(step);
  });

  // These take no input, so the device step is where a retry belongs — and it is the one signing step
  // both flows have.
  it.each(["start_dissolving", "disburse", "refresh_voting_power", "list_neurons"])(
    "retries %s at the device step",
    async action => {
      const props = failed(action as ICPTransactionType);
      const { user } = render(<StepConfirmationFooter {...props} />);

      await user.click(screen.getByText("Retry"));

      expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
    },
  );

  // The call was accepted but never answered. Its own copy says to sync before trying again, and for
  // an additive command a second one that lands applies twice — so re-signing must not be on offer.
  it("does not offer a retry when the outcome is unknown", () => {
    render(<StepConfirmationFooter {...failed("split_neuron", "ICPCallUnconfirmed")} />);

    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("sends the user to the list instead, where the refresh lives", () => {
    render(<StepConfirmationFooter {...failed("split_neuron", "ICPCallUnconfirmed")} />);

    expect(screen.getByTestId("icp-back-to-neurons-button")).toBeInTheDocument();
  });

  // A rejection is a known outcome: nothing ran, so re-signing is safe and is the useful offer.
  it.each(["ICPGovernanceRejected", "ICPCallRejected"])("still offers a retry after %s", name => {
    render(<StepConfirmationFooter {...failed("split_neuron", name)} />);

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});
