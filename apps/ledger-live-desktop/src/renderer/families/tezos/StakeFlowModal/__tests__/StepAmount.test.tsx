import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { StepProps } from "../types";

const syncDispatchMock = jest.fn();
const useDelegationMock = jest.fn().mockReturnValue(null);
const amountFieldMock = jest.fn((_props: Record<string, unknown>) => (
  <div data-testid="amount-field" />
));

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useDelegation: () => useDelegationMock(),
  isAwaitingDelegation: (
    delegation: { isPending?: boolean } | null | undefined,
    transaction: { mode?: string } | null | undefined,
  ) => transaction?.mode === "stake" && (!delegation || !!delegation.isPending),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  useBridgeSync: () => syncDispatchMock,
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
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

import StepAmount from "../steps/StepAmount";

const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-stepamount-test", { currency }),
  }) as unknown as TezosAccount;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  const transaction = {
    family: "tezos",
    mode: "stake",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  } as unknown as Transaction;
  return {
    t: (key: string) => key,
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

describe("StakeFlowModal/StepAmount await-delegation", () => {
  beforeEach(() => {
    syncDispatchMock.mockClear();
    useDelegationMock.mockReturnValue(null);
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("dispatches a priority-200 sync on mount when awaiting delegation in stake mode", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(1);
    expect(syncDispatchMock).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      priority: 200,
      accountId: props.account?.id,
      reason: "tezos-stake-await-delegation",
    });
  });

  it("re-dispatches the sync on every interval tick until the cap", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(5000 * 11);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(12);

    act(() => {
      jest.advanceTimersByTime(5000 * 5);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(12);
  });

  it("does not dispatch the sync in delegate mode", () => {
    const props = makeProps({
      transaction: {
        family: "tezos",
        mode: "delegate",
        amount: new BigNumber(0),
        fees: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
      } as unknown as Transaction,
    });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(syncDispatchMock).not.toHaveBeenCalled();
  });

  it("clears the interval on unmount", () => {
    const props = makeProps();
    let unmount: () => void = () => {};
    act(() => {
      ({ unmount } = render(<StepAmount {...props} />));
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(1);
    act(() => {
      unmount();
    });
    act(() => {
      jest.advanceTimersByTime(5000 * 3);
    });
    expect(syncDispatchMock).toHaveBeenCalledTimes(1);
  });

  it("does not render the bridge error banner while awaiting delegation", () => {
    const props = makeProps({
      error: new Error("Fees estimation failed: stake_modification_with_no_delegate_set"),
    });
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
  });
});

describe("StakeFlowModal/StepAmount delegated state", () => {
  beforeEach(() => {
    syncDispatchMock.mockClear();
    amountFieldMock.mockClear();
    useDelegationMock.mockReturnValue({ address: "tz1baker", isPending: false });
  });

  it("delegates amount input to the shared AmountField with withUseMaxLabel", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    expect(amountFieldMock).toHaveBeenCalledTimes(1);
    const renderedProps = amountFieldMock.mock.calls[0][0];
    expect(renderedProps.withUseMaxLabel).toBe(true);
    expect(renderedProps.account).toBe(props.account);
    expect(renderedProps.transaction).toBe(props.transaction);
    expect(renderedProps.onChangeTransaction).toBe(props.onChangeTransaction);
    expect(renderedProps.status).toBe(props.status);
    expect(renderedProps.bridgePending).toBe(false);
  });
});
