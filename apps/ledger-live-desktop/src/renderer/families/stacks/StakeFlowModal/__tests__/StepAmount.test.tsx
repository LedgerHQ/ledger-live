import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { StacksStakeInPreparePhase } from "@ledgerhq/live-common/families/stacks/errors";
import type {
  StacksAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
import type { StepProps } from "../types";

const amountFieldMock = jest.fn((_props: Record<string, unknown>) => (
  <div data-testid="amount-field" />
));

jest.mock("~/renderer/components/CurrencyDownStatusAlert", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="error-banner" />,
}));
jest.mock("~/renderer/components/SpendableBanner", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/modals/Send/fields/AmountField", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => amountFieldMock(props),
}));
jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => null,
}));

import StepAmount, { StepAmountFooter } from "../steps/StepAmount";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({
    ...genAccount("stacks-stepamount-test", { currency }),
  }) as unknown as StacksAccount;

const makeStatus = (errors: Record<string, Error> = {}): TransactionStatus =>
  ({
    amount: new BigNumber(0),
    errors,
    warnings: {},
  }) as unknown as TransactionStatus;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  const transaction = {
    family: "stacks",
    mode: "delegate",
    amount: new BigNumber(0),
    valAddress: "SP1pool.native-pool-signer-manager",
    familySpecificData: { numCycles: 1 },
  } as unknown as Transaction;
  return {
    t: ((key: string) => key) as unknown as StepProps["t"],
    transitionTo: jest.fn(),
    device: null,
    account,
    transaction,
    status: makeStatus(),
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

describe("StakeFlowModal/StepAmount", () => {
  beforeEach(() => {
    amountFieldMock.mockClear();
  });

  it("throws when account is missing", () => {
    const props = makeProps({ account: null });
    expect(() => render(<StepAmount {...props} />)).toThrow("account required");
  });

  it("throws when the transaction is not a stacks transaction", () => {
    const props = makeProps({ transaction: { family: "bitcoin" } as unknown as Transaction });
    expect(() => render(<StepAmount {...props} />)).toThrow("stacks transaction required");
  });

  it("renders the error banner when an error is present", () => {
    const props = makeProps({ error: new Error("boom") });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(screen.queryByTestId("error-banner")).toBeInTheDocument();
  });

  it("does not render the error banner when there is no error", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
  });

  it("explains a stake refused during the prepare phase", () => {
    const props = makeProps({
      status: makeStatus({
        data: new StacksStakeInPreparePhase(undefined, { blocksUntilReopen: 60 }),
      }),
    });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(screen.queryByTestId("error-banner")).toBeInTheDocument();
  });

  it("keeps a transient data error (startBurnHt still resolving) out of the banner", () => {
    const props = makeProps({ status: makeStatus({ data: new Error("missing startBurnHt") }) });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
  });

  it("passes account, transaction, status and bridgePending through to the shared AmountField", () => {
    const props = makeProps({ bridgePending: true });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(amountFieldMock).toHaveBeenCalledTimes(1);
    const renderedProps = amountFieldMock.mock.calls[0][0];
    expect(renderedProps.account).toBe(props.account);
    expect(renderedProps.transaction).toBe(props.transaction);
    expect(renderedProps.onChangeTransaction).toBe(props.onChangeTransaction);
    expect(renderedProps.status).toBe(props.status);
    expect(renderedProps.bridgePending).toBe(true);
  });
});

describe("StakeFlowModal/StepAmountFooter", () => {
  it("renders nothing when account is missing", () => {
    const props = makeProps({ account: null });
    const { container } = render(<StepAmountFooter {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Continue and shows the loading state while the bridge is pending", () => {
    const props = makeProps({ bridgePending: true });
    const { container } = render(<StepAmountFooter {...props} />);
    const button = container.querySelector("#stacks-stake-amount-continue-button");
    expect(button).toBeDisabled();
  });

  it("disables Continue when the transaction status carries errors", () => {
    const props = makeProps({ status: makeStatus({ amount: new Error("not enough balance") }) });
    const { container } = render(<StepAmountFooter {...props} />);
    const button = container.querySelector("#stacks-stake-amount-continue-button");
    expect(button).toBeDisabled();
  });

  it("enables Continue and transitions to connectDevice when there are no errors and the bridge is not pending", async () => {
    const props = makeProps();
    const { container, user } = render(<StepAmountFooter {...props} />);
    const button = container.querySelector("#stacks-stake-amount-continue-button")!;
    expect(button).toBeEnabled();
    await user.click(button);
    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("offers a Retry that calls onRetry when a flow error (e.g. a failed startBurnHt fetch) is present", async () => {
    // A failed pox fetch leaves startBurnHt unset, so status.errors blocks Continue -- without a
    // retry here the user would be stuck until the next periodic refresh.
    const props = makeProps({
      error: new Error("pox unreachable"),
      status: makeStatus({ data: new Error("missing startBurnHt") }),
    });
    const { container, user } = render(<StepAmountFooter {...props} />);
    expect(container.querySelector("#stacks-stake-amount-continue-button")).toBeDisabled();
    await user.click(container.querySelector("#stacks-stake-amount-retry-button")!);
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render Retry when there is no flow error", () => {
    const { container } = render(<StepAmountFooter {...makeProps()} />);
    expect(container.querySelector("#stacks-stake-amount-retry-button")).toBeNull();
  });
});
