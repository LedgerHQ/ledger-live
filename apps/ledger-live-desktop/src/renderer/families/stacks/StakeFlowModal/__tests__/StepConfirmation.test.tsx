import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import type { Operation } from "@ledgerhq/types-live";
import type { StepProps } from "../types";

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackPage: () => null,
}));
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  setTrackingSource: jest.fn(),
}));
const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
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
import { getAccountUrl } from "~/renderer/utils";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({
    ...genAccount("stacks-stepconfirmation-test", { currency }),
  }) as unknown as StacksAccount;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  const transaction = {
    family: "stacks",
    mode: "delegate",
    amount: new BigNumber(1_000_000),
    valAddress: "SP1pool.native-pool-signer-manager",
    familySpecificData: { numCycles: 1, startBurnHt: 12345 },
  } as unknown as Transaction;
  return {
    t: ((key: string, opts?: { amount?: string }) =>
      opts?.amount ? `${key}:${opts.amount}` : key) as unknown as StepProps["t"],
    transitionTo: jest.fn(),
    device: null,
    account,
    transaction,
    status: {
      amount: new BigNumber(0),
      errors: {},
      warnings: {},
    } as unknown as StepProps["status"],
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
  } as unknown as StepProps;
};

const makeOp = (): Operation =>
  ({
    id: "op-1",
    hash: "h",
    accountId: "stacks-stepconfirmation-test",
    type: "STAKE",
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
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("throws when the transaction is not a stacks transaction", () => {
    const props = makeProps({ transaction: { family: "bitcoin" } as unknown as Transaction });
    expect(() => render(<StepConfirmation {...props} />)).toThrow("stacks transaction required");
  });

  it("renders nothing when neither optimisticOperation nor error is set", () => {
    const props = makeProps();
    const { container } = render(<StepConfirmation {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders success when the operation has been broadcasted", () => {
    const props = makeProps({ optimisticOperation: makeOp() });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("success-display")).toBeInTheDocument();
    expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
  });

  it("renders success with an empty amount text when there is no account to read the unit from", () => {
    const props = makeProps({ optimisticOperation: makeOp(), account: null });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("success-display")).toBeInTheDocument();
  });

  it("renders error display when an error is present", () => {
    const props = makeProps({ error: new Error("boom") });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("error-display")).toBeInTheDocument();
    expect(screen.queryByTestId("success-display")).not.toBeInTheDocument();
  });

  it("shows BroadcastErrorDisclaimer when the error occurs post-signing", () => {
    const props = makeProps({ error: new Error("boom"), signed: true });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("broadcast-error-disclaimer")).toBeInTheDocument();
  });

  it("does not show BroadcastErrorDisclaimer when the error occurs before signing", () => {
    const props = makeProps({ error: new Error("boom"), signed: false });
    act(() => {
      render(<StepConfirmation {...props} />);
    });
    expect(screen.queryByTestId("broadcast-error-disclaimer")).not.toBeInTheDocument();
  });

  it("footer retry calls onRetry and transitions back to the amount step", () => {
    const props = makeProps({ error: new Error("boom") });
    act(() => {
      render(<StepConfirmationFooter {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("retry-button"));
    });
    expect(props.onRetry).toHaveBeenCalledTimes(1);
    expect(props.transitionTo).toHaveBeenCalledWith("amount");
  });

  it("footer success CTA closes the modal and navigates to the account page", () => {
    const props = makeProps({ optimisticOperation: makeOp() });
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(<StepConfirmationFooter {...props} />);
    });
    const cta = result!.container.querySelector("#stacks-stake-confirmation-visit-account-button");
    expect(cta).toBeInTheDocument();
    act(() => {
      fireEvent.click(cta!);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(getAccountUrl(props.account?.id ?? ""));
  });

  it("footer success CTA falls back to the operation's account id when account is missing", () => {
    const operation = makeOp();
    const props = makeProps({ optimisticOperation: operation, account: null });
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(<StepConfirmationFooter {...props} />);
    });
    const cta = result!.container.querySelector("#stacks-stake-confirmation-visit-account-button");
    act(() => {
      fireEvent.click(cta!);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(getAccountUrl(operation.accountId));
  });

  it("footer renders nothing when neither optimisticOperation nor error is set", () => {
    const props = makeProps();
    const { container } = render(<StepConfirmationFooter {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("footer success CTA does not navigate when neither account nor the operation carries an accountId", () => {
    const operation = { ...makeOp(), accountId: undefined } as unknown as Operation;
    const props = makeProps({ optimisticOperation: operation, account: null });
    let result: ReturnType<typeof render>;
    act(() => {
      result = render(<StepConfirmationFooter {...props} />);
    });
    const cta = result!.container.querySelector("#stacks-stake-confirmation-visit-account-button");
    act(() => {
      fireEvent.click(cta!);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
