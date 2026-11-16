import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useNetworkValidators } from "@domain/api-network-validators";
import type { NetworkValidator } from "@domain/entity-network-validators";
import Body from "../Body";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
}));
jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  Track: () => null,
}));
jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));
jest.mock("../steps/StepDelegation", () => ({
  __esModule: true,
  default: () => null,
  StepDelegationFooter: () => null,
}));
jest.mock("../steps/StepAmount", () => ({
  __esModule: true,
  default: () => null,
  StepAmountFooter: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
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
};

const stepperPropsCapture = jest.fn<void, [StepperPropsShape]>();

jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: (props: StepperPropsShape) => {
    stepperPropsCapture(props);
    return (
      <div data-testid="stepper">
        <div data-testid="stepper-step-ids">{props.steps.map(s => s.id).join(",")}</div>
      </div>
    );
  },
}));

const mockedUseAccountBridge = jest.mocked(useAccountBridge);
const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const updateTransaction = jest.fn<void, [(tx: Transaction) => Transaction]>();

const LEDGER: NetworkValidator = { id: "ledger-validator-address", name: "Ledger", isLedger: true };
const OTHER: NetworkValidator = { id: "other-validator-address", name: "Other" };
const mockValidators = (validators: NetworkValidator[]) =>
  jest
    .mocked(useNetworkValidators)
    .mockReturnValue({ validators, pending: false, error: undefined });

const currency = getCryptoCurrencyById("cosmos");
const account = {
  type: "Account",
  freshAddress: "cosmos1test",
  currency,
  stakingResources: { delegations: [] },
} as unknown as CosmosAccount;

const baseBridge = {
  createTransaction: jest.fn(() => ({ mode: "send" }) as unknown as Transaction),
  updateTransaction: jest.fn(
    (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }) as Transaction,
  ),
};

const setupHooks = () => {
  baseBridge.createTransaction.mockClear();
  baseBridge.updateTransaction.mockClear();
  mockedUseAccountBridge.mockReturnValue(
    baseBridge as unknown as ReturnType<typeof useAccountBridge>,
  );
  mockedUseBridgeTransaction.mockImplementation(((_bridge: unknown, factory: () => unknown) => {
    const initial = factory() as {
      transaction: Transaction;
      account: CosmosAccount;
      parentAccount: CosmosAccount | null | undefined;
    };
    return {
      transaction: initial.transaction,
      setTransaction: jest.fn(),
      updateTransaction,
      account: initial.account,
      parentAccount: initial.parentAccount,
      status: { errors: {}, warnings: {} },
      bridgeError: null,
      bridgePending: false,
    };
  }) as unknown as typeof useBridgeTransaction);
};

beforeEach(() => {
  jest.clearAllMocks();
  stepperPropsCapture.mockClear();
  setupHooks();
  mockValidators([OTHER, LEDGER]);
});

const renderBody = () => {
  const props = {
    stepId: "validator" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    params: { account },
  };
  return render(<Body {...props} />);
};

describe("DelegationFlowModal/Body", () => {
  it("renders the delegation Stepper steps in order", () => {
    renderBody();
    expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent(
      "validator,amount,connectDevice,confirmation",
    );
  });

  it("initializes the transaction with mode delegate and the account's fresh address as recipient", () => {
    renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mode: "delegate",
        recipient: "cosmos1test",
      }),
    );
  });

  it("preselects the Ledger validator when the validators are already loaded", () => {
    renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ valAddress: "ledger-validator-address" }),
    );
  });

  it("preselects the Ledger validator once the validators arrive, keeping a validator already picked", () => {
    mockValidators([]);
    const { rerender } = renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ valAddress: "" }),
    );
    expect(updateTransaction).not.toHaveBeenCalled();

    mockValidators([OTHER, LEDGER]);
    rerender(
      <Body
        stepId="validator"
        onClose={jest.fn()}
        onChangeStepId={jest.fn()}
        params={{ account }}
      />,
    );
    const updater = updateTransaction.mock.calls[0][0];
    const delegate = (valAddress: string) =>
      baseBridge.updateTransaction(baseBridge.createTransaction(), {
        mode: "delegate",
        valAddress,
      });
    const empty = delegate("");
    const picked = delegate("other-validator-address");
    expect(updater(empty)).toMatchObject({ valAddress: "ledger-validator-address" });
    expect(updater(picked)).toBe(picked);
  });

  it("preselects nothing when no validator is Ledger's", () => {
    mockValidators([OTHER]);
    renderBody();
    expect(updateTransaction).not.toHaveBeenCalled();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ valAddress: "" }),
    );
  });
});
