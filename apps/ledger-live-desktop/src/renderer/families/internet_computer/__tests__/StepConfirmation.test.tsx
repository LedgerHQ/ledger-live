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
  it.each(["ICPGovernanceRejected", "ICPCallRejected", "ICPCallUnconfirmed", "ICPNeuronsNotRead"])(
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

  // Both list steps render the error in place of the list, so an attempt left set on the way out
  // lands the user straight back on the failure they were leaving.
  it("discards the attempt on the way back to the list", async () => {
    const props = makeStepProps({
      error: Object.assign(new Error("boom"), { name: "ICPCallUnconfirmed" }),
      lastAction: "split_neuron",
      signed: true,
    });
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByTestId("icp-back-to-neurons-button"));

    expect(props.resetAttempt).toHaveBeenCalled();
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
  it.each(["start_dissolving", "disburse", "refresh_voting_power"])(
    "retries %s at the device step",
    async action => {
      const props = failed(action as ICPTransactionType);
      const { user } = render(<StepConfirmationFooter {...props} />);

      await user.click(screen.getByText("Retry"));

      expect(props.transitionTo).toHaveBeenCalledWith("manageAction");
    },
  );

  // Started from the neuron list with no neuron selected, so manageAction — which backs to the manage
  // step — is not somewhere this one can return to.
  it("retries list_neurons at the list flow's own device step", async () => {
    const props = failed("list_neurons");
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByText("Retry"));

    expect(props.transitionTo).toHaveBeenCalledWith("device");
  });
});

/**
 * Once the signature has left the device the request may already be executing, and re-signing is not
 * a redelivery: the expiry is minted at build time, so the retry carries a new request id that the
 * IC's de-duplication does not match. Whether a retry may be offered is therefore a question about
 * the command, not about the error text.
 */
describe("StepConfirmationFooter retry after signing", () => {
  const failedAfterSigning = (lastAction: ICPTransactionType, name = "Error") =>
    makeStepProps({
      error: Object.assign(new Error("boom"), { name }),
      lastAction,
      signed: true,
    });

  // An additive command applies twice if both copies land; the rest move funds or mint a neuron.
  it.each<ICPTransactionType>([
    "increase_dissolve_delay",
    "set_dissolve_delay",
    "split_neuron",
    "disburse",
    "spawn_neuron",
    "stake_maturity",
  ])("does not offer a retry for %s once it may already be executing", action => {
    render(<StepConfirmationFooter {...failedAfterSigning(action)} />);

    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("sends the user to the list instead, where the refresh lives", () => {
    render(<StepConfirmationFooter {...failedAfterSigning("split_neuron")} />);

    expect(screen.getByTestId("icp-back-to-neurons-button")).toBeInTheDocument();
  });

  // A second execution of any of these leaves the neuron where the first one did.
  it.each<ICPTransactionType>([
    "list_neurons",
    "refresh_voting_power",
    "start_dissolving",
    "stop_dissolving",
    "add_hot_key",
    "remove_hot_key",
    "auto_stake_maturity",
    "follow",
  ])("still offers a retry for %s, which repeats harmlessly", action => {
    render(<StepConfirmationFooter {...failedAfterSigning(action)} />);

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  // Both say the command did not take effect — the canister refused it, or the replica refused the
  // message before the canister saw it — so there is nothing for a second attempt to duplicate.
  it.each(["ICPGovernanceRejected", "ICPCallRejected"])(
    "still offers a retry after %s, which reports that nothing ran",
    name => {
      render(<StepConfirmationFooter {...failedAfterSigning("split_neuron", name)} />);

      expect(screen.getByText("Retry")).toBeInTheDocument();
    },
  );

  // The gate used to key on this error name alone, which left every other post-signature failure —
  // an HTTP error from the call endpoint, a throw inside the read-state poll — offering a retry.
  it.each(["ICPCallUnconfirmed", "Error", "NetworkDown"])(
    "withholds the retry after %s, which says nothing about whether the command ran",
    name => {
      render(<StepConfirmationFooter {...failedAfterSigning("increase_dissolve_delay", name)} />);

      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    },
  );
});
