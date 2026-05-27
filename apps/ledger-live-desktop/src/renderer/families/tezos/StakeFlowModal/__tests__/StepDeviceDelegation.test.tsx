import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { StepProps } from "../types";

type GenericStepConnectDeviceProps = {
  onOperationBroadcasted: (op: Operation) => void;
  transitionTo: (next: string) => void;
};

const genericStepMock = jest.fn((_props: GenericStepConnectDeviceProps) => (
  <div data-testid="generic-step-connect-device" />
));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: (props: GenericStepConnectDeviceProps) => genericStepMock(props),
}));

import StepDeviceDelegation from "../steps/StepDeviceDelegation";

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({ ...genAccount("tezos-stepdevicedelegation-test", { currency }) }) as unknown as TezosAccount;

const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "tezos",
    mode: "delegate",
    amount: new BigNumber(0),
    fees: new BigNumber(300),
    recipient: "tz1baker",
    useAllAmount: false,
    ...overrides,
  }) as unknown as Transaction;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  t: (key: string) => key,
  transitionTo: jest.fn(),
  device: null,
  account: makeAccount(),
  parentAccount: null,
  transaction: makeTx(),
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(300),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
  bridgePending: false,
  error: null,
  optimisticOperation: null,
  signed: false,
  failedStep: null,
  onClose: jest.fn(),
  openModal: jest.fn(),
  onChangeTransaction: jest.fn(),
  onUpdateTransaction: jest.fn(),
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  onRetry: jest.fn(),
  setSigned: jest.fn(),
  ...overrides,
}) as unknown as StepProps;

describe("StakeFlowModal/StepDeviceDelegation", () => {
  beforeEach(() => {
    genericStepMock.mockClear();
  });

  it("renders the preparing spinner while the bridge is pending", () => {
    act(() => {
      render(<StepDeviceDelegation {...makeProps({ bridgePending: true })} />);
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("renders the preparing spinner when transaction.fees is missing", () => {
    act(() => {
      render(
        <StepDeviceDelegation
          {...makeProps({ transaction: makeTx({ fees: null }) })}
        />,
      );
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("mounts GenericStepConnectDevice once fees are populated and bridge settles", () => {
    act(() => {
      render(<StepDeviceDelegation {...makeProps()} />);
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
  });

  it("redirects post-broadcast transitionTo('confirmation') to 'amount'", () => {
    const transitionTo = jest.fn();
    act(() => {
      render(<StepDeviceDelegation {...makeProps({ transitionTo })} />);
    });
    const propsCalled = genericStepMock.mock.calls[0][0];
    act(() => {
      propsCalled.onOperationBroadcasted({} as Operation);
      propsCalled.transitionTo("confirmation");
    });
    expect(transitionTo).toHaveBeenCalledWith("amount");
    expect(transitionTo).not.toHaveBeenCalledWith("confirmation");
  });

  it("forwards transitionTo unchanged on non-broadcast paths (sign error)", () => {
    const transitionTo = jest.fn();
    act(() => {
      render(<StepDeviceDelegation {...makeProps({ transitionTo })} />);
    });
    const propsCalled = genericStepMock.mock.calls[0][0];
    act(() => {
      propsCalled.transitionTo("confirmation");
    });
    expect(transitionTo).toHaveBeenCalledWith("confirmation");
  });
});
