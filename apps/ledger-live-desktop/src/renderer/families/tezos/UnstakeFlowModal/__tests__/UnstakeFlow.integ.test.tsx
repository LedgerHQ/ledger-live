import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import type {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { createMockAccount, createMockOperation } from "../../__tests__/testUtils";
import type { StepId } from "../types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
}));
jest.mock("~/renderer/analytics/Track", () => ({ __esModule: true, default: () => null }));

jest.mock("../steps/StepAmount", () => ({
  __esModule: true,
  default: () => <div data-testid="step-amount">amount-content</div>,
  StepAmountFooter: () => null,
}));

jest.mock("../steps/StepConnectDevice", () => ({
  __esModule: true,
  default: (props: {
    transitionTo: (id: StepId) => void;
    onOperationBroadcasted: (op: ReturnType<typeof createMockOperation>) => void;
    onTransactionError: (e: Error) => void;
    account?: { id?: string };
  }) => (
    <div data-testid="step-device">
      <button
        type="button"
        data-testid="device-broadcast"
        onClick={() => {
          props.onOperationBroadcasted(createMockOperation(props.account?.id));
          props.transitionTo("confirmation");
        }}
      >
        broadcast
      </button>
      <button
        type="button"
        data-testid="device-error"
        onClick={() => {
          props.onTransactionError(new Error("boom"));
          props.transitionTo("confirmation");
        }}
      >
        error
      </button>
    </div>
  ),
}));

jest.mock("../steps/StepConfirmation", () => ({
  __esModule: true,
  default: () => <div data-testid="step-confirmation">confirmation-content</div>,
  StepConfirmationFooter: () => null,
}));

import Body from "../Body";

const status = {
  amount: new BigNumber(0),
  errors: {},
  warnings: {},
} as unknown as TransactionStatus;

const baseBridge = {
  createTransaction: jest.fn(() => ({ mode: "send" }) as unknown as Transaction),
  updateTransaction: jest.fn(
    (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }) as Transaction,
  ),
};

const setTransaction = jest.fn();

const mockedUseAccountBridge = jest.mocked(useAccountBridge);
const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);

beforeEach(() => {
  jest.clearAllMocks();
  baseBridge.createTransaction.mockClear();
  baseBridge.updateTransaction.mockClear();
  setTransaction.mockClear();
  mockedUseAccountBridge.mockReturnValue(
    baseBridge as unknown as ReturnType<typeof useAccountBridge>,
  );
  mockedUseBridgeTransaction.mockImplementation(((_bridge: unknown, factory: () => unknown) => {
    const initial = factory() as {
      transaction: Transaction;
      account: TezosAccount;
      parentAccount: TezosAccount | null | undefined;
    };
    return {
      transaction: initial.transaction,
      setTransaction,
      updateTransaction: jest.fn(),
      account: initial.account,
      parentAccount: initial.parentAccount,
      status,
      bridgeError: null,
      bridgePending: false,
    };
  }) as unknown as typeof useBridgeTransaction);
});

const ControlledBody = ({ initialStep }: { initialStep: StepId }) => {
  const [stepId, setStepId] = useState<StepId>(initialStep);
  return (
    <Body
      stepId={stepId}
      onClose={jest.fn()}
      onChangeStepId={setStepId}
      params={{ account: createMockAccount("tezos-unstake-integ") }}
    />
  );
};

describe("Tezos unstake flow (integration)", () => {
  it("renders the three step labels in order in the breadcrumb", () => {
    render(<ControlledBody initialStep="amount" />);

    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Device")).toBeInTheDocument();
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
  });

  it("initialises the bridge transaction with mode: unstake", () => {
    render(<ControlledBody initialStep="amount" />);
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      mode: "unstake",
    });
  });

  it("renders the right step content for each stepId", async () => {
    const { user } = render(<ControlledBody initialStep="device" />);
    expect(screen.getByTestId("step-device")).toBeInTheDocument();
    expect(screen.queryByTestId("step-amount")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step-confirmation")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId("device-broadcast"));
    });

    expect(screen.getByTestId("step-confirmation")).toBeInTheDocument();
    expect(screen.queryByTestId("step-device")).not.toBeInTheDocument();
  });

  it("hides the breadcrumb when a transaction error occurs", async () => {
    const { user } = render(<ControlledBody initialStep="device" />);

    // Breadcrumb visible while no error
    expect(screen.getByText("Amount")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId("device-error"));
    });

    expect(screen.queryByText("Amount")).not.toBeInTheDocument();
    expect(screen.queryByText("Device")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmation")).not.toBeInTheDocument();
  });
});
