import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import logger from "~/renderer/logger";
import Body from "../Body";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
}));
jest.mock("~/renderer/logger", () => {
  const loggerMock = {
    critical: jest.fn(),
    onReduxAction: jest.fn(),
    onDB: jest.fn(),
    onTabKey: jest.fn(),
    apdu: jest.fn(),
    websocket: jest.fn(),
    network: jest.fn(),
    networkSucceed: jest.fn(),
    networkError: jest.fn(),
    networkDown: jest.fn(),
    analyticsStart: jest.fn(),
    analyticsStop: jest.fn(),
    analyticsTrack: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return { __esModule: true, default: loggerMock };
});
jest.mock("~/renderer/analytics/Track", () => ({ __esModule: true, default: () => null }));
jest.mock("../steps/StepAmount", () => ({
  __esModule: true,
  default: () => null,
  StepAmountFooter: () => null,
}));
jest.mock("../steps/StepConnectDevice", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../steps/StepConfirmation", () => ({
  __esModule: true,
  default: () => null,
  StepConfirmationFooter: () => null,
}));

type StepperPropsShape = {
  stepId: string;
  steps: Array<{ id: string }>;
  onStepChange: (s: { id: string }) => void;
  onRetry: () => void;
  onOperationBroadcasted: (op: { id: string; accountId: string }) => void;
  onTransactionError: (e: Error) => void;
  optimisticOperation: unknown;
  error: unknown;
  signed: boolean;
};

const stepperPropsCapture = jest.fn<void, [StepperPropsShape]>();

jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: (props: StepperPropsShape) => {
    stepperPropsCapture(props);
    return (
      <div data-testid="stepper">
        <div data-testid="stepper-step-id">{props.stepId}</div>
        <div data-testid="stepper-step-ids">{props.steps.map(s => s.id).join(",")}</div>
        <button
          data-testid="stepper-change-to-device"
          onClick={() => props.onStepChange(props.steps[1])}
        >
          change-to-device
        </button>
        <button data-testid="stepper-retry" onClick={() => props.onRetry()}>
          retry
        </button>
        <button
          data-testid="stepper-broadcast"
          onClick={() =>
            props.onOperationBroadcasted({ id: "op-1", accountId: "captured-by-callback" })
          }
        >
          broadcast
        </button>
        <button
          data-testid="stepper-tx-error"
          onClick={() => props.onTransactionError(new Error("boom"))}
        >
          tx-error
        </button>
        <button
          data-testid="stepper-tx-refused"
          onClick={() => props.onTransactionError(new UserRefusedOnDevice())}
        >
          tx-refused
        </button>
      </div>
    );
  },
}));

const mockedUseAccountBridge = jest.mocked(useAccountBridge);
const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const mockedLoggerCritical = logger.critical as jest.Mock;

const currency = getCryptoCurrencyById("tezos");
const account = {
  ...genAccount("tezos-unstake-body", { currency }),
} as unknown as TezosAccount;

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

const setupHooks = () => {
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
};

beforeEach(() => {
  jest.clearAllMocks();
  stepperPropsCapture.mockClear();
  setupHooks();
});

const renderBody = (overrides: Partial<React.ComponentProps<typeof Body>> = {}) => {
  const props = {
    stepId: "amount" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    params: { account },
    ...overrides,
  };
  return { ...render(<Body {...props} />), props };
};

describe("UnstakeFlowModal/Body", () => {
  it("renders the three-step Stepper in the documented order", () => {
    renderBody();
    expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent("amount,device,confirmation");
    expect(screen.getByTestId("stepper-step-id")).toHaveTextContent("amount");
  });

  it("initializes the bridge transaction with mode: unstake", () => {
    renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      mode: "unstake",
    });
  });

  it("propagates step changes to the parent via onChangeStepId", async () => {
    const { props, user } = renderBody();
    await user.click(screen.getByTestId("stepper-change-to-device"));
    expect(props.onChangeStepId).toHaveBeenCalledWith("device");
  });

  it("handleRetry resets the flow back to the amount step", async () => {
    const { props, user } = renderBody();
    await user.click(screen.getByTestId("stepper-retry"));
    expect(props.onChangeStepId).toHaveBeenCalledWith("amount");
  });

  it("clears optimisticOperation and error state when retry is clicked after broadcast/error", async () => {
    const { user } = renderBody();
    await act(async () => {
      await user.click(screen.getByTestId("stepper-broadcast"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ optimisticOperation: expect.objectContaining({ id: "op-1" }) }),
    );
    await act(async () => {
      await user.click(screen.getByTestId("stepper-retry"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ optimisticOperation: null, error: null, signed: false }),
    );
  });

  it("logs critical when transaction error is not a UserRefusedOnDevice", async () => {
    const { user } = renderBody();
    await user.click(screen.getByTestId("stepper-tx-error"));
    expect(mockedLoggerCritical).toHaveBeenCalledTimes(1);
    expect(mockedLoggerCritical.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("does not log critical when the user refused on device", async () => {
    const { user } = renderBody();
    await user.click(screen.getByTestId("stepper-tx-refused"));
    expect(mockedLoggerCritical).not.toHaveBeenCalled();
  });

  it("forwards the transaction error to the Stepper for display", async () => {
    const { user } = renderBody();
    await act(async () => {
      await user.click(screen.getByTestId("stepper-tx-error"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
