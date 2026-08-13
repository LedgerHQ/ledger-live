import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { StepConfirmationFooter } from "../StepConfirmation";
import type { StepProps } from "../../types";

const account = {
  ...createFixtureAccount(),
  currency: { id: "zcash", family: "bitcoin" },
} as unknown as StepProps["account"];

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  t: ((k: string) => k) as never,
  stepId: "confirmation",
  device: null,
  account,
  error: undefined,
  transitionTo: jest.fn(),
  openModal: jest.fn() as never,
  closeModal: jest.fn(),
  onRetry: jest.fn(),
  onClose: jest.fn(),
  ufvk: "",
  ufvkExportError: null,
  onStepIdChanged: jest.fn(),
  onUfvkChanged: jest.fn(),
  birthday: "",
  invalidBirthday: false,
  syncFromZero: false,
  handleBirthdayChange: jest.fn(),
  handleSyncFromZero: jest.fn(),
  handleEnableShieldedBalance: jest.fn(),
  ...overrides,
});

describe("StepConfirmationFooter", () => {
  it("Close button calls handleEnableShieldedBalance(ready) and closeModal", () => {
    const closeModal = jest.fn();
    const handleEnableShieldedBalance = jest.fn();
    render(<StepConfirmationFooter {...makeProps({ closeModal, handleEnableShieldedBalance })} />);
    screen.getByTestId("modal-close-button").click();
    expect(handleEnableShieldedBalance).toHaveBeenCalledWith("ready");
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it("Start sync button calls handleEnableShieldedBalance(running) and closeModal", () => {
    const closeModal = jest.fn();
    const handleEnableShieldedBalance = jest.fn();
    render(<StepConfirmationFooter {...makeProps({ closeModal, handleEnableShieldedBalance })} />);
    screen.getByRole("button", { name: /start/i }).click();
    expect(handleEnableShieldedBalance).toHaveBeenCalledWith("running");
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it("dispatches MODAL_RECEIVE when source is 'receive' and Close is clicked", () => {
    const { store } = render(<StepConfirmationFooter {...makeProps({ source: "receive" })} />, {
      initialState: withFlagOverrides({}),
    });
    screen.getByTestId("modal-close-button").click();
    const state = store.getState() as Record<string, unknown>;
    const modals = state.modals as Record<string, { isOpened: boolean }> | undefined;
    expect(modals?.MODAL_RECEIVE?.isOpened).toBe(true);
  });

  it("does not dispatch MODAL_RECEIVE when source is not 'receive'", () => {
    const { store } = render(<StepConfirmationFooter {...makeProps({})} />, {
      initialState: withFlagOverrides({}),
    });
    screen.getByTestId("modal-close-button").click();
    const state = store.getState() as Record<string, unknown>;
    const modals = state.modals as Record<string, { isOpened: boolean }> | undefined;
    expect(modals?.MODAL_RECEIVE?.isOpened).toBeFalsy();
  });
});
