import React from "react";
import { act, render, screen } from "tests/testSetup";
import { openModal } from "~/renderer/actions/modals";
import StakingModal from "../index";
import type { StepId } from "../types";
import { createMockMinaAccount } from "../../__tests__/testUtils";

jest.mock("../Body", () => ({
  __esModule: true,
  default: ({
    stepId,
    onClose,
    onChangeStepId,
    params,
  }: {
    stepId: StepId;
    onClose: () => void;
    onChangeStepId: (stepId: StepId) => void;
    params: { mode?: "undelegate" };
  }) => (
    <div data-testid="mina-stake-body">
      <span data-testid="body-step-id">{stepId}</span>
      <span data-testid="body-mode">{params.mode ?? "delegate"}</span>
      <button data-testid="body-to-confirmation" onClick={() => onChangeStepId("confirmation")}>
        to-confirmation
      </button>
      <button data-testid="body-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

const account = createMockMinaAccount();

const openedState = (mode?: "undelegate") => ({
  modals: {
    MODAL_MINA_STAKE: { isOpened: true, data: { account, ...(mode ? { mode } : {}) } },
  },
});

describe("StakingFlowModal (wrapper)", () => {
  beforeEach(() => {
    const node = document.createElement("div");
    node.id = "modals";
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("renders nothing when the modal is closed", () => {
    render(<StakingModal account={account} />);

    expect(screen.queryByTestId("mina-stake-body")).not.toBeInTheDocument();
  });

  it("starts on the validator step in delegate mode", async () => {
    render(<StakingModal account={account} />, { initialState: openedState() });

    expect(await screen.findByTestId("body-step-id")).toHaveTextContent("validator");
    expect(screen.getByTestId("body-mode")).toHaveTextContent("delegate");
  });

  it("starts on the device step in undelegate mode", async () => {
    render(<StakingModal account={account} mode="undelegate" />, {
      initialState: openedState("undelegate"),
    });

    expect(await screen.findByTestId("body-step-id")).toHaveTextContent("connectDevice");
    expect(screen.getByTestId("body-mode")).toHaveTextContent("undelegate");
  });

  it("applies the step changes requested by the body", async () => {
    const { user } = render(<StakingModal account={account} />, { initialState: openedState() });

    await act(async () => {
      await user.click(await screen.findByTestId("body-to-confirmation"));
    });

    expect(screen.getByTestId("body-step-id")).toHaveTextContent("confirmation");
  });

  it("closes the modal and resets the flow to the validator step on reopen", async () => {
    const { user, store } = render(<StakingModal account={account} />, {
      initialState: openedState(),
    });

    await act(async () => {
      await user.click(await screen.findByTestId("body-to-confirmation"));
      await user.click(screen.getByTestId("body-close"));
    });
    expect(store.getState().modals.MODAL_MINA_STAKE?.isOpened).toBe(false);

    await act(async () => {
      store.dispatch(openModal("MODAL_MINA_STAKE", { account }));
    });

    expect(await screen.findByTestId("body-step-id")).toHaveTextContent("validator");
  });

  it("lets a backdrop click dismiss the validator step", async () => {
    const { user, store } = render(<StakingModal account={account} />, {
      initialState: openedState(),
    });
    await screen.findByTestId("mina-stake-body");

    await act(async () => {
      await user.click(screen.getByTestId("modal-backdrop"));
    });

    expect(store.getState().modals.MODAL_MINA_STAKE?.isOpened).toBe(false);
  });

  it("locks the backdrop once the device step is reached", async () => {
    const { user, store } = render(<StakingModal account={account} mode="undelegate" />, {
      initialState: openedState("undelegate"),
    });
    await screen.findByTestId("mina-stake-body");

    await act(async () => {
      await user.click(screen.getByTestId("modal-backdrop"));
    });

    expect(store.getState().modals.MODAL_MINA_STAKE?.isOpened).toBe(true);
  });
});
