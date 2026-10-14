import React from "react";
import { render } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import StepDestinationValidators from "./StepDestinationValidators";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));

let fieldOnChange: ((a: { address: string }) => void) | null = null;
jest.mock("../fields/ValidatorField", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (a: { address: string }) => void }) => {
    fieldOnChange = onChange;
    return <div data-testid="validator-field" />;
  },
}));

const buildProps = (transaction: Partial<Transaction> = {}): StepProps =>
  ({
    account: {
      type: "Account",
      currency: getCryptoCurrencyById("cosmos"),
    } as unknown as CosmosAccount,
    parentAccount: undefined,
    transaction: { family: "cosmos", mode: "redelegate", ...transaction } as Transaction,
    onUpdateTransaction: jest.fn(),
    transitionTo: jest.fn(),
  }) as unknown as StepProps;

describe("Cosmos Redelegation StepDestinationValidators", () => {
  beforeEach(() => {
    fieldOnChange = null;
  });

  it("sets the transaction's dstValAddress and transitions back to the validators step", () => {
    const props = buildProps({ valAddress: "validatorA" });
    render(<StepDestinationValidators {...props} />);
    fieldOnChange?.({ address: "validatorB" });
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.dstValAddress).toBe("validatorB");
    expect(props.transitionTo).toHaveBeenCalledWith("validators");
  });
});
