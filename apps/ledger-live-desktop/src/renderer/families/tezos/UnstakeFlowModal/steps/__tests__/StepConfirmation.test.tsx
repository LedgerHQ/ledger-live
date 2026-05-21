import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import type { Operation } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import StepConfirmation, { StepConfirmationFooter } from "../StepConfirmation";
import type { StepProps } from "../../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncOneAccountOnMount: () => null,
}));
jest.mock("~/renderer/drawers/OperationDetails", () => ({
  __esModule: true,
  OperationDetails: () => null,
}));
jest.mock("~/renderer/drawers/Provider", () => {
  const React = require("react");
  return {
    __esModule: true,
    setDrawer: jest.fn(),
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

const mockedSetDrawer = jest.mocked(setDrawer);

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");
const account = {
  ...genAccount("tezos-unstake-stepconfirmation", { currency }),
} as unknown as TezosAccount;

const makeOp = (): Operation =>
  ({
    id: "op-1",
    accountId: account.id,
    hash: "ophash",
    type: "UNSTAKE",
    senders: [],
    recipients: [],
    value: new BigNumber(0),
    fee: new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {},
  }) as unknown as Operation;

const baseProps: StepProps = {
  t: ((k: string) => k) as unknown as StepProps["t"],
  transitionTo: jest.fn(),
  device: null,
  account,
  parentAccount: null,
  transaction: { mode: "unstake", amount: new BigNumber(0) } as unknown as Transaction,
  status: {
    amount: new BigNumber(0),
    errors: {},
    warnings: {},
  } as unknown as TransactionStatus,
  bridgePending: false,
  signed: false,
  optimisticOperation: null,
  error: null,
  onClose: jest.fn(),
  onChangeTransaction: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  onTransactionError: jest.fn(),
  onRetry: jest.fn(),
  setSigned: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("UnstakeFlowModal/StepConfirmation", () => {
  it("shows success when an optimisticOperation is set", () => {
    render(<StepConfirmation {...baseProps} optimisticOperation={makeOp()} />);
    expect(screen.getByText(/Unstake submitted/i)).toBeInTheDocument();
  });

  it("shows broadcast disclaimer when signed and an error occurs", () => {
    render(<StepConfirmation {...baseProps} signed error={new Error("broadcast failed")} />);
    expect(
      screen.getByText(/Your unstaking transaction couldn't be sent to the network/i),
    ).toBeInTheDocument();
  });

  it("does not show the broadcast disclaimer when the tx was not signed", () => {
    render(<StepConfirmation {...baseProps} error={new Error("aborted")} />);
    expect(
      screen.queryByText(/Your unstaking transaction couldn't be sent to the network/i),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when neither operation nor error", () => {
    const { container } = render(<StepConfirmation {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("UnstakeFlowModal/StepConfirmationFooter", () => {
  it("always renders the Close button", () => {
    render(<StepConfirmationFooter {...baseProps} />);
    expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
  });

  it("renders the success CTA when an optimisticOperation is set", async () => {
    const onClose = jest.fn();
    const op = makeOp();
    const { user } = render(
      <StepConfirmationFooter {...baseProps} optimisticOperation={op} onClose={onClose} />,
    );
    const cta = screen.getByText(/View details/i);
    await user.click(cta);
    expect(onClose).toHaveBeenCalled();
    expect(mockedSetDrawer).toHaveBeenCalledWith(expect.any(Function), {
      operationId: op.id,
      accountId: account.id,
    });
  });

  it("renders a Retry button when an error is present and no operation", async () => {
    const onRetry = jest.fn();
    const { user } = render(
      <StepConfirmationFooter {...baseProps} error={new Error("x")} onRetry={onRetry} />,
    );
    const retry = screen.getByText(/Retry/i);
    await user.click(retry);
    expect(onRetry).toHaveBeenCalled();
  });
});
