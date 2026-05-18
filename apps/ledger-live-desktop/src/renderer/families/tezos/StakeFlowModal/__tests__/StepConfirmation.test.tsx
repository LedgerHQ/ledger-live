import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: () => null,
  setTrackingSource: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  setTrackingSource: jest.fn(),
}));
jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  __esModule: true,
  useLocalizedUrl: () => "https://stake.example",
}));
jest.mock("~/renderer/linking", () => ({ __esModule: true, openURL: jest.fn() }));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncOneAccountOnMount: () => null,
}));
jest.mock("~/renderer/components/SuccessDisplay", () => ({
  __esModule: true,
  default: ({ title }: { title: React.ReactNode }) => (
    <div data-testid="success-display">{title}</div>
  ),
}));
jest.mock("~/renderer/components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-display">{error.message}</div>,
}));
jest.mock("~/renderer/components/BroadcastErrorDisclaimer", () => ({
  __esModule: true,
  default: () => <div data-testid="broadcast-error-disclaimer" />,
}));
jest.mock("~/renderer/components/RetryButton", () => ({
  __esModule: true,
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="retry-button" onClick={onClick}>
      retry
    </button>
  ),
}));

import StepConfirmation, { StepConfirmationFooter } from "../steps/StepConfirmation";

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-stepconfirmation-test", { currency }),
  }) as unknown as TezosAccount;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  const transaction = {
    family: "tezos",
    mode: "stake",
    amount: new BigNumber(1_000_000),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  } as unknown as Transaction;
  return {
    t: (key: string, opts?: { amount?: string }) => (opts?.amount ? `${key}:${opts.amount}` : key),
    transitionTo: jest.fn(),
    device: null,
    account,
    parentAccount: null,
    transaction,
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
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
  } as unknown as StepProps;
};

const makeOp = (): Operation =>
  ({
    id: "op-1",
    hash: "h",
    accountId: "tezos-stepconfirmation-test",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    transactionSequenceNumber: 0,
    date: new Date(),
    extra: {},
  }) as unknown as Operation;

describe("StakeFlowModal/StepConfirmation", () => {
  it("renders success when the operation has been broadcasted", () => {
    const props = makeProps({ optimisticOperation: makeOp() });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("success-display")).toBeInTheDocument();
    expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
  });

  it("renders error display when an error is present", () => {
    const err = new Error("boom");
    const props = makeProps({ error: err });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("error-display")).toBeInTheDocument();
    expect(screen.queryByTestId("success-display")).not.toBeInTheDocument();
  });

  it("shows BroadcastErrorDisclaimer when error occurs post-signing", () => {
    const props = makeProps({ error: new Error("boom"), signed: true });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("broadcast-error-disclaimer")).toBeInTheDocument();
  });

  it("footer retry calls onRetry and transitions to failedStep", () => {
    const props = makeProps({ error: new Error("boom"), failedStep: "device-staking" });
    act(() => {
      render(<StepConfirmationFooter {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("retry-button"));
    });
    expect(props.onRetry).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("device-staking");
  });

  it("footer retry falls back to 'amount' when no failedStep is set", () => {
    const props = makeProps({ error: new Error("boom"), failedStep: null });
    act(() => {
      render(<StepConfirmationFooter {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("retry-button"));
    });
    expect(props.transitionTo).toHaveBeenCalledWith("amount");
  });

  it("footer success CTA closes the modal", () => {
    const props = makeProps({ optimisticOperation: makeOp() });
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(<StepConfirmationFooter {...props} />);
    });
    const cta = result!.container.querySelector("#tezos-stake-confirmation-visit-earn-button");
    expect(cta).toBeInTheDocument();
    act(() => {
      fireEvent.click(cta!);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
