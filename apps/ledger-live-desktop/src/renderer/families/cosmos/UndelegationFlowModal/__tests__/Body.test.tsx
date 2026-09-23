import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import Body from "../Body";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge");
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncSkipUnderPriority: () => null,
}));
jest.mock("~/renderer/analytics/Track", () => ({ __esModule: true, default: () => null }));
jest.mock("../steps/Amount", () => ({
  __esModule: true,
  default: () => null,
  StepAmountFooter: () => null,
}));
jest.mock("~/renderer/modals/Send/steps/GenericStepConnectDevice", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../steps/Confirmation", () => ({
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

const currency = getCryptoCurrencyById("cosmos");
const account = {
  type: "Account",
  freshAddress: "cosmos1test",
  currency,
  stakingResources: {
    delegations: [
      { validatorAddress: "validatorA", amount: BigNumber(250), pendingRewards: BigNumber(0) },
    ],
  },
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
    };
    return {
      transaction: initial.transaction,
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      account: initial.account,
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
});

const renderBody = (validatorAddress = "validatorA") => {
  const props = {
    account,
    stepId: "amount" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    validatorAddress,
  };
  return render(<Body {...props} />);
};

describe("UndelegationFlowModal/Body", () => {
  it("renders the undelegation Stepper steps in order", () => {
    renderBody();
    expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent("amount,device,confirmation");
  });

  it("initializes the transaction with the given validator's delegated amount", () => {
    renderBody("validatorA");
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mode: "undelegate",
        valAddress: "validatorA",
        amount: BigNumber(250),
      }),
    );
  });

  it("defaults the amount to zero when the validator has no matching delegation", () => {
    renderBody("unknown-validator");
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        valAddress: "unknown-validator",
        amount: BigNumber(0),
      }),
    );
  });
});
