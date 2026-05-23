import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { StepProps } from "../types";

const genericStepMock = jest.fn(() => <div data-testid="generic-step-connect-device" />);

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => genericStepMock(),
}));

import StepDeviceStaking from "../steps/StepDeviceStaking";

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({ ...genAccount("tezos-stepdevicestaking-test", { currency }) }) as unknown as TezosAccount;

const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "tezos",
    mode: "stake",
    amount: new BigNumber(1_000_000),
    fees: new BigNumber(300),
    recipient: "",
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
    amount: new BigNumber(1_000_000),
    totalSpent: new BigNumber(1_000_300),
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

describe("StakeFlowModal/StepDeviceStaking", () => {
  beforeEach(() => {
    genericStepMock.mockClear();
  });

  it("renders the preparing spinner while the bridge is pending", () => {
    act(() => {
      render(<StepDeviceStaking {...makeProps({ bridgePending: true })} />);
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("renders the preparing spinner when transaction.fees is missing", () => {
    act(() => {
      render(<StepDeviceStaking {...makeProps({ transaction: makeTx({ fees: null }) })} />);
    });
    expect(screen.getByText("Preparing transaction…")).toBeInTheDocument();
    expect(genericStepMock).not.toHaveBeenCalled();
  });

  it("mounts GenericStepConnectDevice once fees are populated and bridge settles", () => {
    act(() => {
      render(<StepDeviceStaking {...makeProps()} />);
    });
    expect(screen.queryByText("Preparing transaction…")).not.toBeInTheDocument();
    expect(genericStepMock).toHaveBeenCalledTimes(1);
  });
});
