import React from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type {
  CosmosAccount,
  CosmosMappedDelegation,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import StepValidators from "./StepValidators";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));
jest.mock("@ledgerhq/live-common/families/cosmos/chain", () => ({
  __esModule: true,
  default: () => ({ unbondingPeriod: 21 }),
}));
jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));

const VALIDATOR_A = { validatorAddress: "validatorA", name: "Validator A" };
const VALIDATOR_B = { validatorAddress: "validatorB", name: "Validator B" };

jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useCosmosFamilyPreloadData: () => ({ validators: [VALIDATOR_A, VALIDATOR_B] }),
}));

let selectorOnChange: ((delegation?: CosmosMappedDelegation | null) => void) | null = null;
jest.mock("../fields/RedelegationSelectorField", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (d?: CosmosMappedDelegation | null) => void }) => {
    selectorOnChange = onChange;
    return <div data-testid="redelegation-selector" />;
  },
}));

let amountOnChange: ((amount: BigNumber) => void) | null = null;
jest.mock("~/renderer/families/cosmos/UndelegationFlowModal/fields/index", () => ({
  __esModule: true,
  AmountField: ({ onChange }: { onChange: (amount: BigNumber) => void }) => {
    amountOnChange = onChange;
    return <div data-testid="amount-field" />;
  },
}));

const buildAccount = (): CosmosAccount =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById("cosmos"),
    stakingResources: {
      delegations: [
        { validatorAddress: "validatorA", amount: BigNumber(100), pendingRewards: BigNumber(0) },
      ],
    },
  }) as unknown as CosmosAccount;

const buildProps = (transaction: Partial<Transaction>): StepProps =>
  ({
    account: buildAccount(),
    parentAccount: undefined,
    transaction: { family: "cosmos", mode: "redelegate", ...transaction } as Transaction,
    status: { errors: {}, warnings: {} },
    onUpdateTransaction: jest.fn(),
    warning: null,
    error: null,
    t: (k: string) => k,
    transitionTo: jest.fn(),
  }) as unknown as StepProps;

describe("Cosmos Redelegation StepValidators", () => {
  beforeEach(() => {
    selectorOnChange = null;
    amountOnChange = null;
  });

  it("does not show the amount field when no source validator matches the transaction's valAddress", () => {
    render(<StepValidators {...buildProps({ valAddress: "unknown-address" })} />);
    expect(screen.queryByTestId("amount-field")).not.toBeInTheDocument();
  });

  it("shows the destination validator's name once dstValAddress matches a preloaded validator", () => {
    render(
      <StepValidators {...buildProps({ valAddress: "validatorA", dstValAddress: "validatorB" })} />,
    );
    expect(screen.getByText("Validator B")).toBeVisible();
  });

  it("shows the placeholder to choose a validator when dstValAddress is unset", () => {
    render(<StepValidators {...buildProps({ valAddress: "validatorA" })} />);
    expect(
      screen.getByText("cosmos.redelegation.flow.steps.validators.chooseValidator"),
    ).toBeVisible();
  });

  it("shows the amount field once both a source and a destination validator are resolved", () => {
    render(
      <StepValidators {...buildProps({ valAddress: "validatorA", dstValAddress: "validatorB" })} />,
    );
    expect(screen.getByTestId("amount-field")).toBeVisible();
  });

  it("updates the transaction's valAddress and amount when a new source validator is selected", () => {
    const props = buildProps({ valAddress: "validatorA" });
    render(<StepValidators {...props} />);
    const delegation = {
      validatorAddress: "validatorA",
    } as unknown as CosmosMappedDelegation;
    selectorOnChange?.(delegation);
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.valAddress).toBe("validatorA");
    expect(result.amount).toEqual(BigNumber(100));
  });

  it("defaults the amount to zero when the selected source validator has no matching delegation", () => {
    const props = buildProps({ valAddress: "validatorA" });
    render(<StepValidators {...props} />);
    const delegation = {
      validatorAddress: "unknown-address",
    } as unknown as CosmosMappedDelegation;
    selectorOnChange?.(delegation);
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.amount).toEqual(BigNumber(0));
  });

  it("ignores the selector callback when no delegation is provided", () => {
    const props = buildProps({ valAddress: "validatorA" });
    render(<StepValidators {...props} />);
    selectorOnChange?.(null);
    expect(props.onUpdateTransaction).not.toHaveBeenCalled();
  });

  it("updates the transaction's amount when the amount field changes", () => {
    const props = buildProps({ valAddress: "validatorA", dstValAddress: "validatorB" });
    render(<StepValidators {...props} />);
    amountOnChange?.(BigNumber(42));
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.amount).toEqual(BigNumber(42));
  });

  it("transitions to the destination validators step when the select button is clicked", async () => {
    const props = buildProps({ valAddress: "validatorA" });
    const { user } = render(<StepValidators {...props} />);
    await user.click(screen.getByText("cosmos.redelegation.flow.steps.validators.chooseValidator"));
    expect(props.transitionTo).toHaveBeenCalledWith("destinationValidators");
  });
});
