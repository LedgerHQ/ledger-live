import React from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type {
  CosmosAccount,
  CosmosMappedDelegation,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import StepAmount from "./Amount";
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
jest.mock("@ledgerhq/coin-cosmos/chain/chain", () => ({
  __esModule: true,
  default: () => ({ unbondingPeriod: 21 }),
}));
jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/NotEnoughFundsToUnstake", () => ({
  __esModule: true,
  default: () => <div data-testid="not-enough-funds" />,
}));

let validatorOnChange: ((delegation?: CosmosMappedDelegation | null) => void) | null = null;
jest.mock("../fields", () => ({
  __esModule: true,
  ValidatorField: ({ onChange }: { onChange: (d?: CosmosMappedDelegation | null) => void }) => {
    validatorOnChange = onChange;
    return <div data-testid="validator-field" />;
  },
  AmountField: ({
    amount,
    validator,
  }: {
    amount: BigNumber;
    validator: { address: string; amount: BigNumber };
  }) => (
    <div data-testid="amount-field">
      {validator.address}:{amount.toString()}
    </div>
  ),
}));

const buildAccount = (): CosmosAccount =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById("cosmos"),
    stakingResources: { delegations: [] },
  }) as unknown as CosmosAccount;

const buildProps = (transaction: Partial<Transaction>): StepProps =>
  ({
    account: buildAccount(),
    transaction: { family: "cosmos", mode: "undelegate", ...transaction } as Transaction,
    status: { errors: {}, warnings: {} },
    onUpdateTransaction: jest.fn(),
    error: null,
    onClose: jest.fn(),
  }) as unknown as StepProps;

describe("Cosmos Undelegation StepAmount", () => {
  beforeEach(() => {
    validatorOnChange = null;
  });

  it("derives the validator field from the transaction's valAddress and amount", () => {
    render(<StepAmount {...buildProps({ valAddress: "validatorA", amount: BigNumber(50) })} />);
    expect(screen.getByTestId("amount-field")).toHaveTextContent("validatorA:50");
  });

  it("falls back to an empty address when the transaction has no valAddress yet", () => {
    render(<StepAmount {...buildProps({ amount: BigNumber(0) })} />);
    expect(screen.getByTestId("amount-field")).toHaveTextContent(":0");
  });

  it("updates the transaction's valAddress and amount when a validator is chosen", () => {
    const props = buildProps({ amount: BigNumber(0) });
    render(<StepAmount {...props} />);
    const delegation = {
      validatorAddress: "validatorB",
      amount: BigNumber(77),
    } as unknown as CosmosMappedDelegation;
    validatorOnChange?.(delegation);
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.valAddress).toBe("validatorB");
    expect(result.amount).toEqual(BigNumber(77));
  });

  it("ignores the validator callback when no delegation is provided", () => {
    const props = buildProps({ amount: BigNumber(0) });
    render(<StepAmount {...props} />);
    validatorOnChange?.(null);
    expect(props.onUpdateTransaction).not.toHaveBeenCalled();
  });

  it("shows the not-enough-funds banner when status reports a NotEnoughBalance amount error", () => {
    const props = buildProps({ amount: BigNumber(0) });
    props.status.errors = { amount: { name: "NotEnoughBalance" } as unknown as Error };
    render(<StepAmount {...props} />);
    expect(screen.getByTestId("not-enough-funds")).toBeVisible();
  });

  it("does not show the not-enough-funds banner for other error types", () => {
    const props = buildProps({ amount: BigNumber(0) });
    props.status.errors = { amount: { name: "SomeOtherError" } as unknown as Error };
    render(<StepAmount {...props} />);
    expect(screen.queryByTestId("not-enough-funds")).not.toBeInTheDocument();
  });
});
