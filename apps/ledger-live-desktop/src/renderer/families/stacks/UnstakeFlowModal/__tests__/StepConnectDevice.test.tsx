import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import type { StepProps } from "../types";

const genericStepMock = jest.fn((_props: Record<string, unknown>) => (
  <div data-testid="generic-step-connect-device" />
));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => genericStepMock(props),
}));
jest.mock("~/renderer/components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <button data-testid="error-display-retry" data-error={error.name} onClick={onRetry}>
      retry
    </button>
  ),
}));

import StepConnectDevice from "../steps/StepConnectDevice";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({
    ...genAccount("stacks-unstake-stepconnectdevice-test", { currency }),
  }) as unknown as StacksAccount;

const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "stacks",
    mode: "undelegate",
    valAddress: "SP1pool.native-pool-signer-manager",
    amount: new BigNumber(0),
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
      amount: new BigNumber(0),
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

describe("UnstakeFlowModal/StepConnectDevice", () => {
  beforeEach(() => {
    genericStepMock.mockClear();
  });

  it("renders the preparing spinner while the bridge is pending, instead of mounting the device step", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps({ bridgePending: true })} />);
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("renders the preparing spinner when neither fee nor fees is set yet (regression: avoids an already-connected device hitting FeeNotLoaded)", () => {
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

  it("mounts GenericStepConnectDevice for the MODAL_STACKS_UNSTAKE modal once the classic bridge's fee is populated", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps()} />);
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(screen.getByTestId("generic-step-connect-device")).toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
    expect(genericStepMock).toHaveBeenCalledWith(
      expect.objectContaining({ modalName: "MODAL_STACKS_UNSTAKE" }),
    );
  });

  it("mounts GenericStepConnectDevice once only the generic bridge's fees is populated (post flag-flip shape)", () => {
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

  it("shows a retryable error instead of an endless spinner when fee preparation failed", async () => {
    // Failed prepare: bridgePending is back to false but fee was never set -- the spinner gate alone
    // would keep the modal waiting with no way out.
    const props = makeProps({
      error: new Error("fee estimation failed"),
      transaction: makeTx({ fee: undefined, fees: undefined }),
    });
    const { user } = render(<StepConnectDevice {...props} />);
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("error-display-retry"));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("surfaces the status error instead of an endless spinner when preparation settles with no fee and no thrown error", () => {
    // Classic-bridge undelegate: prepareTransaction resolves without a fee (no recipient) and never
    // throws, so only getTransactionStatus reports why.
    const gas = new Error("fee not loaded");
    gas.name = "FeeNotLoaded";
    const recipient = new Error("recipient required");
    recipient.name = "RecipientRequired";
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({
            transaction: makeTx({ fee: undefined, fees: undefined }),
            status: {
              errors: { recipient, gas },
              warnings: {},
              amount: new BigNumber(0),
            } as unknown as StepProps["status"],
          })}
        />,
      );
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("error-display-retry")).toHaveAttribute("data-error", "FeeNotLoaded");
  });

  it("shows the preparing spinner, not the stale error, while a retry's re-prepare is pending", () => {
    act(() => {
      render(
        <StepConnectDevice
          {...makeProps({
            error: new Error("fee estimation failed"),
            bridgePending: true,
            transaction: makeTx({ fee: undefined }),
          })}
        />,
      );
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(screen.queryByTestId("error-display-retry")).not.toBeInTheDocument();
  });

  it("passes account, transaction, status and the callback props through unchanged once ready", () => {
    const props = makeProps();
    act(() => {
      render(<StepConnectDevice {...props} />);
    });
    expect(genericStepMock).toHaveBeenCalledWith(
      expect.objectContaining({
        account: props.account,
        transaction: props.transaction,
        status: props.status,
        transitionTo: props.transitionTo,
        onOperationBroadcasted: props.onOperationBroadcasted,
        onTransactionError: props.onTransactionError,
        setSigned: props.setSigned,
      }),
    );
  });
});
