import React from "react";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import { openModal } from "~/renderer/actions/modals";
import StakeFlowModal from "../index";
import type { StepId } from "../types";
import type { Data } from "../Body";

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
    params: Data;
  }) => (
    <div data-testid="stacks-stake-body">
      <span data-testid="body-step-id">{stepId}</span>
      <span data-testid="body-account-id">{params.account?.id}</span>
      <button data-testid="body-to-connect-device" onClick={() => onChangeStepId("connectDevice")}>
        to-connect-device
      </button>
      <button data-testid="body-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

const currency = getCryptoCurrencyById("stacks");
const account = {
  ...genAccount("stacks-stake-modal-wrapper", { currency }),
} as unknown as StacksAccount;

const openedState = {
  modals: {
    MODAL_STACKS_STAKE: { isOpened: true, data: { account } },
  },
};

describe("StakeFlowModal (wrapper)", () => {
  beforeEach(() => {
    const node = document.createElement("div");
    node.id = "modals";
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("renders nothing when the modal is closed", () => {
    render(<StakeFlowModal account={account} />);
    expect(screen.queryByTestId("stacks-stake-body")).not.toBeInTheDocument();
  });

  it("starts on the validator step with the account passed to openModal", async () => {
    render(<StakeFlowModal account={account} />, { initialState: openedState });

    expect(await screen.findByTestId("body-step-id")).toHaveTextContent("validator");
    expect(screen.getByTestId("body-account-id")).toHaveTextContent(account.id);
  });

  it("applies the step changes requested by the body", async () => {
    const { user } = render(<StakeFlowModal account={account} />, { initialState: openedState });

    await act(async () => {
      await user.click(await screen.findByTestId("body-to-connect-device"));
    });

    expect(screen.getByTestId("body-step-id")).toHaveTextContent("connectDevice");
  });

  it("closes the modal and resets the flow to the validator step on reopen", async () => {
    const { user, store } = render(<StakeFlowModal account={account} />, {
      initialState: openedState,
    });

    await act(async () => {
      await user.click(await screen.findByTestId("body-to-connect-device"));
      await user.click(screen.getByTestId("body-close"));
    });
    expect(store.getState().modals.MODAL_STACKS_STAKE?.isOpened).toBe(false);

    await act(async () => {
      store.dispatch(openModal("MODAL_STACKS_STAKE", { account }));
    });

    expect(await screen.findByTestId("body-step-id")).toHaveTextContent("validator");
  });

  it("lets a backdrop click dismiss the validator step", async () => {
    const { user, store } = render(<StakeFlowModal account={account} />, {
      initialState: openedState,
    });
    await screen.findByTestId("stacks-stake-body");

    await act(async () => {
      await user.click(screen.getByTestId("modal-backdrop"));
    });

    expect(store.getState().modals.MODAL_STACKS_STAKE?.isOpened).toBe(false);
  });

  it("locks the backdrop once the device step is reached", async () => {
    const { user, store } = render(<StakeFlowModal account={account} />, {
      initialState: openedState,
    });
    await screen.findByTestId("stacks-stake-body");

    await act(async () => {
      await user.click(await screen.findByTestId("body-to-connect-device"));
      await user.click(screen.getByTestId("modal-backdrop"));
    });

    expect(store.getState().modals.MODAL_STACKS_STAKE?.isOpened).toBe(true);
  });
});
