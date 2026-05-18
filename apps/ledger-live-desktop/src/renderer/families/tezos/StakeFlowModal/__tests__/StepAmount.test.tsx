import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { StepProps } from "../types";

const syncDispatchMock = jest.fn();
const useDelegationMock = jest.fn().mockReturnValue(null);
const stakingInfoMock = jest.fn(() => ({
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(1_000_000),
  delegateAddress: undefined,
}));
const updateTransactionMock = jest.fn((tx, patch) => ({ ...tx, ...patch }));

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useDelegation: () => useDelegationMock(),
  useTezosStakingInfo: () => stakingInfoMock(),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  useBridgeSync: () => syncDispatchMock,
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => ({
    createTransaction: jest.fn(),
    updateTransaction: updateTransactionMock,
    getTransactionStatus: jest.fn(),
  }),
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
jest.mock("~/renderer/components/RequestAmount", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (amount: BigNumber) => void }) => (
    <button data-testid="request-amount-fire" onClick={() => onChange(new BigNumber(123_456))}>
      onChange
    </button>
  ),
}));
jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => null,
}));

import StepAmount from "../steps/StepAmount";

setSupportedCurrencies(["tezos"]);
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
});

describe("StakeFlowModal/StepAmount delegated state", () => {
  beforeEach(() => {
    syncDispatchMock.mockClear();
    updateTransactionMock.mockClear();
    useDelegationMock.mockReturnValue({ address: "tz1baker", isPending: false });
  });

  it("onMax sets amount = availableBalance - reserve", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("tezos-stake-amount-max-button"));
    });
    expect(updateTransactionMock).toHaveBeenCalledTimes(1);
    const [, patch] = updateTransactionMock.mock.calls[0];
    // availableBalance (1_000_000) - reserve (0.5 XTZ × 1e6 = 500_000) = 500_000
    expect((patch.amount as BigNumber).toString()).toBe("500000");
    expect(props.onChangeTransaction).toHaveBeenCalledTimes(1);
  });

  it("onMax clamps to 0 when the reserve exceeds availableBalance", () => {
    stakingInfoMock.mockReturnValueOnce({
      isDelegated: true,
      isStaked: false,
      hasUnstaking: false,
      delegation: null,
      stakedBalance: new BigNumber(0),
      unstakedBalance: new BigNumber(0),
      unstakedFinalizable: new BigNumber(0),
      availableBalance: new BigNumber(100),
      delegateAddress: undefined,
    });
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("tezos-stake-amount-max-button"));
    });
    const [, patch] = updateTransactionMock.mock.calls[0];
    expect((patch.amount as BigNumber).toString()).toBe("0");
  });

  it("onChange from RequestAmount propagates via bridge.updateTransaction", () => {
    const props = makeProps();
    act(() => {
      render(<StepAmount {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByTestId("request-amount-fire"));
    });
    expect(updateTransactionMock).toHaveBeenCalledTimes(1);
    const [, patch] = updateTransactionMock.mock.calls[0];
    expect((patch.amount as BigNumber).toString()).toBe("123456");
    expect(props.onChangeTransaction).toHaveBeenCalledTimes(1);
  });
});
