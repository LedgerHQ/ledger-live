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

import StepConnectDevice from "../steps/StepConnectDevice";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({
    ...genAccount("stacks-unstake-stepconnectdevice-test", { currency }),
  }) as unknown as StacksAccount;

const makeTx = (): Transaction =>
  ({
    family: "stacks",
    mode: "undelegate",
    valAddress: "SP1pool.native-pool-signer-manager",
    amount: new BigNumber(0),
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

  it("mounts GenericStepConnectDevice for the MODAL_STACKS_UNSTAKE modal", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps()} />);
    });
    expect(screen.getByTestId("generic-step-connect-device")).toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
    expect(genericStepMock).toHaveBeenCalledWith(
      expect.objectContaining({ modalName: "MODAL_STACKS_UNSTAKE" }),
    );
  });

  it("passes account, transaction, status and the callback props through unchanged", () => {
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

  it("mounts unconditionally, unlike the Stake flow's variant (no bridgePending/startBurnHt gating)", () => {
    act(() => {
      render(<StepConnectDevice {...makeProps({ bridgePending: true })} />);
    });
    expect(genericStepMock).toHaveBeenCalledTimes(1);
  });
});
