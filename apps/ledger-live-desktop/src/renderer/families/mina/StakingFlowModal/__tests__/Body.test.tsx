import React from "react";
import { act, render, screen } from "tests/testSetup";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/families/mina/types";
import logger from "~/renderer/logger";
import Body from "../Body";
import {
  createMockMinaAccount,
  createMockTransaction,
  createMockTransactionStatus,
} from "../../__tests__/testUtils";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
}));
jest.mock("~/renderer/analytics/Track", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
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
  },
}));
jest.mock("../steps/StepValidator", () => ({
  __esModule: true,
  default: () => null,
  StepValidatorFooter: () => null,
}));
jest.mock("../steps/StepConfirmation", () => ({
  __esModule: true,
  default: () => null,
  StepConfirmationFooter: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => null,
}));

type StepperPropsShape = {
  stepId: string;
  steps: Array<{ id: string; onBack?: (props: { transitionTo: (id: string) => void }) => void }>;
  errorSteps: number[];
  hideBreadcrumb: boolean;
  optimisticOperation: unknown;
  error: unknown;
  onStepChange: (s: { id: string }) => void;
  onRetry: () => void;
  onOperationBroadcasted: (op: { id: string; accountId: string }) => void;
  onTransactionError: (e: Error) => void;
};

const stepperPropsCapture = jest.fn<void, [StepperPropsShape]>();

jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: (props: StepperPropsShape) => {
    stepperPropsCapture(props);
    return (
      <div data-testid="stepper">
        <div data-testid="stepper-step-ids">{props.steps.map(s => s.id).join(",")}</div>
        <div data-testid="stepper-error-steps">{props.errorSteps.join(",")}</div>
        <button
          data-testid="stepper-next-step"
          onClick={() => props.onStepChange(props.steps[props.steps.length - 1])}
        >
          next
        </button>
        <button data-testid="stepper-retry" onClick={() => props.onRetry()}>
          retry
        </button>
        <button
          data-testid="stepper-broadcast"
          onClick={() =>
            props.onOperationBroadcasted({
              id: "op-1",
              accountId: "js:2:mina:B62testaddress:mina",
            })
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

const account = createMockMinaAccount();

const bridge = {
  createTransaction: jest.fn(() => createMockTransaction()),
  updateTransaction: jest.fn(
    (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }) as Transaction,
  ),
};

const setupHooks = ({ bridgeError = null }: { bridgeError?: Error | null } = {}) => {
  mockedUseAccountBridge.mockReturnValue(bridge as unknown as ReturnType<typeof useAccountBridge>);
  mockedUseBridgeTransaction.mockImplementation(((_bridge: unknown, factory: () => unknown) => {
    const initial = factory() as { transaction: Transaction };
    return {
      transaction: initial.transaction,
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      status: createMockTransactionStatus(),
      bridgeError,
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
    stepId: "validator" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    params: { account },
    ...overrides,
  };
  return { ...render(<Body {...props} />), props };
};

describe("StakingFlowModal/Body", () => {
  describe("delegate mode", () => {
    it("renders the three-step delegate flow", () => {
      renderBody();

      expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent(
        "validator,connectDevice,confirmation",
      );
    });

    it("initializes the bridge transaction with txType stake", () => {
      renderBody();

      expect(bridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
        txType: "stake",
      });
    });

    it("retry sends the user back to the validator step", async () => {
      const { props, user } = renderBody();

      await user.click(screen.getByTestId("stepper-retry"));

      expect(props.onChangeStepId).toHaveBeenCalledWith("validator");
    });

    it("flags the confirmation step as failed on a transaction error", async () => {
      const { user } = renderBody();

      await act(async () => {
        await user.click(screen.getByTestId("stepper-tx-error"));
      });

      expect(screen.getByTestId("stepper-error-steps")).toHaveTextContent("2");
    });

    it("goes back from the device step to the validator step", () => {
      renderBody();
      const transitionTo = jest.fn();

      const deviceStep = stepperPropsCapture.mock.calls[0][0].steps[1];
      deviceStep.onBack?.({ transitionTo });

      expect(transitionTo).toHaveBeenCalledWith("validator");
    });
  });

  describe("undelegate mode", () => {
    it("renders the two-step undelegate flow", () => {
      renderBody({ stepId: "connectDevice", params: { account, mode: "undelegate" } });

      expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent(
        "connectDevice,confirmation",
      );
    });

    it("initializes the bridge transaction with txType unstake and self as recipient", () => {
      renderBody({ stepId: "connectDevice", params: { account, mode: "undelegate" } });

      expect(bridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
        txType: "unstake",
        recipient: account.freshAddress,
      });
    });

    it("retry sends the user back to the device step", async () => {
      const { props, user } = renderBody({
        stepId: "connectDevice",
        params: { account, mode: "undelegate" },
      });

      await user.click(screen.getByTestId("stepper-retry"));

      expect(props.onChangeStepId).toHaveBeenCalledWith("connectDevice");
    });

    it("flags the confirmation step as failed on a transaction error", async () => {
      const { user } = renderBody({
        stepId: "connectDevice",
        params: { account, mode: "undelegate" },
      });

      await act(async () => {
        await user.click(screen.getByTestId("stepper-tx-error"));
      });

      expect(screen.getByTestId("stepper-error-steps")).toHaveTextContent("1");
    });
  });

  it("propagates step changes to the parent via onChangeStepId", async () => {
    const { props, user } = renderBody();

    await user.click(screen.getByTestId("stepper-next-step"));

    expect(props.onChangeStepId).toHaveBeenCalledWith("confirmation");
  });

  it("flags the first step as failed when the bridge itself errors", () => {
    setupHooks({ bridgeError: new Error("bridge down") });

    renderBody();

    expect(screen.getByTestId("stepper-error-steps")).toHaveTextContent("0");
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it("records the broadcasted operation as pending and clears the error on retry", async () => {
    const { user, store } = render(
      <Body
        stepId="validator"
        onClose={jest.fn()}
        onChangeStepId={jest.fn()}
        params={{ account }}
      />,
      { initialState: { accounts: [account] } },
    );

    await act(async () => {
      await user.click(screen.getByTestId("stepper-broadcast"));
    });
    expect(store.getState().accounts[0].pendingOperations).toHaveLength(1);
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ optimisticOperation: expect.objectContaining({ id: "op-1" }) }),
    );

    await act(async () => {
      await user.click(screen.getByTestId("stepper-tx-error"));
      await user.click(screen.getByTestId("stepper-retry"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(expect.objectContaining({ error: null }));
  });

  it("logs critical when the transaction error is not a device refusal", async () => {
    const { user } = renderBody();

    await user.click(screen.getByTestId("stepper-tx-error"));

    expect(mockedLoggerCritical).toHaveBeenCalledTimes(1);
  });

  it("does not log critical when the user refused on device", async () => {
    const { user } = renderBody();

    await user.click(screen.getByTestId("stepper-tx-refused"));

    expect(mockedLoggerCritical).not.toHaveBeenCalled();
  });

  it("hides the breadcrumb on the validator step when an error is displayed", async () => {
    const { user } = renderBody();

    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ hideBreadcrumb: false }),
    );

    await act(async () => {
      await user.click(screen.getByTestId("stepper-tx-error"));
    });

    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ hideBreadcrumb: true }),
    );
  });
});
