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
jest.mock("../steps/StepStarter", () => ({
  __esModule: true,
  default: () => null,
  StepStarterFooter: () => null,
}));
jest.mock("../steps/StepValidators", () => ({
  __esModule: true,
  default: () => null,
  StepValidatorsFooter: () => null,
}));
jest.mock("../steps/StepDestinationValidators", () => ({
  __esModule: true,
  default: () => null,
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

const currency = getCryptoCurrencyById("cosmos");
const account = {
  type: "Account",
  freshAddress: "cosmos1test",
  currency,
  stakingResources: {
    delegations: [
      { validatorAddress: "validatorA", amount: BigNumber(100), pendingRewards: BigNumber(0) },
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
      parentAccount: CosmosAccount | null | undefined;
    };
    return {
      transaction: initial.transaction,
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
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
});

const renderBody = (params: Partial<React.ComponentProps<typeof Body>["params"]> = {}) => {
  const props = {
    stepId: "validators" as const,
    onClose: jest.fn(),
    onChangeStepId: jest.fn(),
    params: {
      account,
      validatorAddress: "validatorA",
      validatorDstAddress: "validatorB",
      ...params,
    },
  };
  return render(<Body {...props} />);
};

describe("RedelegationFlowModal/Body", () => {
  it("renders the redelegation Stepper steps in order", () => {
    renderBody();
    expect(screen.getByTestId("stepper-step-ids")).toHaveTextContent(
      "validators,connectDevice,confirmation,destinationValidators,starter",
    );
  });

  it("initializes the transaction with the source validator's delegated amount", () => {
    renderBody();
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mode: "redelegate",
        valAddress: "validatorA",
        dstValAddress: "validatorB",
        amount: BigNumber(100),
      }),
    );
  });

  it("defaults the delegated amount to zero when the source validator has no matching delegation", () => {
    renderBody({ validatorAddress: "unknown-validator" });
    expect(baseBridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dstValAddress: "validatorB",
        amount: BigNumber(0),
      }),
    );
  });
});
