import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import type { StepProps } from "../types";

const genericStepMock = jest.fn(() => <div data-testid="generic-step-connect-device" />);

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => genericStepMock(),
}));

import StepConnectDevice from "../steps/StepConnectDevice";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({ ...genAccount("stacks-stepconnectdevice-test", { currency }) }) as unknown as StacksAccount;

const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "stacks",
    mode: "delegate",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    familySpecificData: { numCycles: 1, startBurnHt: 12345 },
    fee: new BigNumber(300),
    ...overrides,
  }) as unknown as Transaction;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    t: (key: string) => key,
    transitionTo: jest.fn(),
    device: null,
    account: makeAccount(),
    transaction: makeTx(),
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(300),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(300),
    },
    bridgePending: false,
    error: null,
    optimisticOperation: null,
    signed: false,
    onClose: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    ...overrides,
  }) as unknown as StepProps;

describe("StakeFlowModal/StepConnectDevice", () => {
  beforeEach(() => {
    genericStepMock.mockClear();
  });

  it("renders the preparing spinner while the bridge is pending", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps({ bridgePending: true })} />);
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("renders the preparing spinner when startBurnHt hasn't resolved yet", () => {
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({
            transaction: makeTx({ familySpecificData: { numCycles: 1, startBurnHt: undefined } }),
          })}
        />,
      );
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("renders the preparing spinner when neither fee nor fees is set", () => {
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({ transaction: makeTx({ fee: undefined, fees: undefined }) })}
        />,
      );
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("mounts GenericStepConnectDevice once the classic bridge's `fee` is populated", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps()} />);
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
  });

  it("mounts GenericStepConnectDevice once only the generic bridge's `fees` is populated (post flag-flip shape)", () => {
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({ transaction: makeTx({ fee: undefined, fees: new BigNumber(300) }) })}
        />,
      );
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
  });

  it("renders an error display with a retry action instead of an infinite spinner when resolving startBurnHt fails", () => {
    const onRetry = jest.fn();
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({
            error: new Error("network error"),
            onRetry,
            transaction: makeTx({ familySpecificData: { numCycles: 1, startBurnHt: undefined } }),
          })}
        />,
      );
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    act(() => {
      fireEvent.click(retryButton);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
