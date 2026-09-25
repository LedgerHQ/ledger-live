import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen, waitFor } from "tests/testSetup";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  StacksAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
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
const fetchPoxInfoMock = jest.fn();
jest.mock("@ledgerhq/live-common/families/stacks/react", () => ({
  __esModule: true,
  fetchPoxInfo: () => fetchPoxInfoMock(),
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
jest.mock("../steps/StepValidator", () => ({
  __esModule: true,
  default: () => null,
  StepValidatorFooter: () => null,
}));
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
  onTransactionError: (e: Error) => void;
  transaction: Transaction | null | undefined;
  setSigned: (signed: boolean) => void;
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
        <button data-testid="stepper-retry" onClick={() => props.onRetry()}>
          retry
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
        <button data-testid="stepper-set-signed" onClick={() => props.setSigned(true)}>
          set-signed
        </button>
      </div>
    );
  },
}));

const mockedUseAccountBridge = jest.mocked(useAccountBridge);
const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const mockedLoggerCritical = logger.critical as jest.Mock;

const currency = getCryptoCurrencyById("stacks");
const account = {
  ...genAccount("stacks-stake-body", { currency }),
} as unknown as StacksAccount;

const status = {
  amount: new BigNumber(0),
  errors: {},
  warnings: {},
} as unknown as TransactionStatus;

const baseBridge = {
  createTransaction: jest.fn(() => ({ family: "stacks" }) as unknown as Transaction),
  updateTransaction: jest.fn(
    (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }) as Transaction,
  ),
};

let currentTransaction: Transaction | undefined;
let currentAccount: StacksAccount;
const setTransaction = jest.fn((tx: Transaction) => {
  currentTransaction = tx;
});

const setupHooks = () => {
  baseBridge.createTransaction.mockClear();
  baseBridge.updateTransaction.mockClear();
  setTransaction.mockClear();
  currentTransaction = undefined;
  mockedUseAccountBridge.mockReturnValue(
    baseBridge as unknown as ReturnType<typeof useAccountBridge>,
  );
  // The real hook builds the transaction from the factory once, then keeps it across renders.
  mockedUseBridgeTransaction.mockImplementation(((_bridge: unknown, factory: () => unknown) => {
    if (!currentTransaction) {
      const initial = factory() as { transaction: Transaction; account: StacksAccount };
      currentTransaction = initial.transaction;
      currentAccount = initial.account;
    }
    return {
      get transaction() {
        return currentTransaction;
      },
      setTransaction,
      updateTransaction: jest.fn(),
      account: currentAccount,
      status,
      bridgeError: null,
      bridgePending: false,
    };
  }) as unknown as typeof useBridgeTransaction);
};

beforeEach(() => {
  jest.clearAllMocks();
  stepperPropsCapture.mockClear();
  fetchPoxInfoMock.mockReturnValue(new Promise(() => {})); // never resolves unless overridden
  setupHooks();
});

const renderBody = (
  overrides: Partial<React.ComponentProps<typeof Body>> = {},
  renderOptions: Parameters<typeof render>[1] = {},
) => {
  const props = {
    stepId: "validator" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    params: { account },
    ...overrides,
  };
  return { ...render(<Body {...props} />, renderOptions), props };
};

const connectedDeviceState = {
  devices: { currentDevice: { deviceId: "mock", modelId: "nanoX", wired: true }, devices: [] },
};

describe("StakeFlowModal/Body", () => {
  it("renders the four-step Stepper in the documented order", () => {
    renderBody();
    expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent(
      "validator,amount,connectDevice,confirmation",
    );
    expect(screen.getByTestId("stepper-step-id")).toHaveTextContent("validator");
  });

  it("initializes the bridge transaction with familySpecificData.numCycles: 1, mode unset until a pool is entered", () => {
    // `mode` is set later by StepValidator's onChangeValAddress, alongside `valAddress` -- setting
    // it here, before any pool address exists, is what the generic-bridge migration can't handle
    // (see StepValidator.test.tsx and Body.tsx's initial-transaction comment).
    renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      familySpecificData: { numCycles: 1 },
    });
  });

  it("merges the resolved startBurnHt into familySpecificData once the device step is entered", async () => {
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    renderBody({ stepId: "connectDevice" });

    await waitFor(() => {
      expect(setTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          familySpecificData: { numCycles: 1, startBurnHt: 123456 },
        }),
      );
    });
  });

  it("does not resolve startBurnHt while the user is still on the editing steps", async () => {
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { rerender, props } = renderBody();
    rerender(<Body {...props} stepId="amount" />);

    await act(async () => {});
    expect(fetchPoxInfoMock).not.toHaveBeenCalled();
  });

  it("resolves a fresh startBurnHt when the user steps back and re-enters the device step", async () => {
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { rerender, props } = renderBody({ stepId: "connectDevice" });
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));

    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123999 });
    rerender(<Body {...props} stepId="amount" />);
    await waitFor(() =>
      expect(setTransaction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          familySpecificData: { numCycles: 1, startBurnHt: undefined },
        }),
      ),
    );

    rerender(<Body {...props} stepId="connectDevice" />);
    await waitFor(() =>
      expect(setTransaction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          familySpecificData: { numCycles: 1, startBurnHt: 123999 },
        }),
      ),
    );
  });

  it("handleRetry clears error/optimisticOperation/signed state and re-resolves startBurnHt", async () => {
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { user } = renderBody({ stepId: "connectDevice" });
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await user.click(screen.getByTestId("stepper-tx-error"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
    );

    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 124000 });
    await act(async () => {
      await user.click(screen.getByTestId("stepper-retry"));
    });
    expect(stepperPropsCapture).toHaveBeenLastCalledWith(
      expect.objectContaining({ optimisticOperation: null, error: null, signed: false }),
    );
    await waitFor(() =>
      expect(setTransaction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          familySpecificData: { numCycles: 1, startBurnHt: 124000 },
        }),
      ),
    );
  });

  it("sets up a 5-minute periodic refresh of startBurnHt while waiting on the device step", async () => {
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    renderBody({ stepId: "connectDevice" });
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    setIntervalSpy.mockRestore();
  });

  it("stops refreshing startBurnHt once the device has signed", async () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { user } = renderBody({ stepId: "connectDevice" });
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await user.click(screen.getByTestId("stepper-set-signed"));
    });
    // signed flips to true, re-running the effect: the previous interval's cleanup fires even
    // though the effect body then bails out immediately (stepId !== "connectDevice" || signed).
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("keeps refreshing startBurnHt while ready for the device but no device has connected yet", async () => {
    // Before a device is present, GenericStepConnectDevice's device-signing hook has no deviceId
    // and never subscribes to signOperation, so mutating `transaction` here cannot interrupt
    // anything -- the refresh must keep protecting against staleness while the user is still away
    // from their device (no `devices.currentDevice` in this render's initial state).
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { rerender, props } = renderBody({ stepId: "connectDevice" });
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));
    clearIntervalSpy.mockClear();

    currentTransaction = { ...currentTransaction, fee: new BigNumber(1) } as Transaction;
    rerender(<Body {...props} stepId="connectDevice" />);

    // isReadyForDevice is now true, but with no device connected mustFreezeTransaction stays false,
    // so the periodic-refresh effect's dependencies are unchanged and its interval is never torn down.
    await act(async () => {});
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("stops refreshing startBurnHt once a device connects while ready for the device, before signing starts", async () => {
    // GenericStepConnectDevice's device-signing effect depends on `transaction` (hw/actions/transaction.ts)
    // and tears down/restarts an in-flight sign request whenever that reference changes once a real
    // device is present -- so once fee + startBurnHt are resolved AND a device shows up, no further
    // mutation may reach `transaction`, well before `signed` ever flips true.
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    fetchPoxInfoMock.mockResolvedValue({ current_burnchain_block_height: 123456 });
    const { rerender, props } = renderBody(
      { stepId: "connectDevice" },
      { initialState: connectedDeviceState },
    );
    await waitFor(() => expect(fetchPoxInfoMock).toHaveBeenCalledTimes(1));
    clearIntervalSpy.mockClear();

    currentTransaction = { ...currentTransaction, fee: new BigNumber(1) } as Transaction;
    rerender(<Body {...props} stepId="connectDevice" />);

    await waitFor(() => expect(clearIntervalSpy).toHaveBeenCalled());
    fetchPoxInfoMock.mockClear();
    await act(async () => {});
    expect(fetchPoxInfoMock).not.toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("surfaces a pox info fetch failure instead of leaving the device step waiting", async () => {
    fetchPoxInfoMock.mockRejectedValue(new Error("pox unreachable"));
    renderBody({ stepId: "connectDevice" });

    await waitFor(() =>
      expect(stepperPropsCapture).toHaveBeenLastCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
      ),
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
});
