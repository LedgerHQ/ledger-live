import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import ValidatorField from "./ValidatorField";

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));

const VALIDATOR_A = { validatorAddress: "validatorA", name: "Validator A" };
const VALIDATOR_B = { validatorAddress: "validatorB", name: "Validator B" };

jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useLedgerFirstShuffledValidatorsCosmosFamily: () => [VALIDATOR_A, VALIDATOR_B],
}));

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("cosmos"),
} as unknown as CosmosAccount;

describe("Cosmos Redelegation ValidatorField", () => {
  it("excludes the source validator (transaction.valAddress) from the destination list", () => {
    render(
      <ValidatorField
        account={account}
        transaction={
          { family: "cosmos", mode: "redelegate", valAddress: "validatorA" } as Transaction
        }
        onChange={jest.fn()}
      />,
    );
    expect(screen.queryByText("Validator A")).not.toBeInTheDocument();
    expect(screen.getByText("Validator B")).toBeVisible();
  });

  it("shows all validators when the transaction has no source validator set", () => {
    render(
      <ValidatorField
        account={account}
        transaction={{ family: "cosmos", mode: "redelegate" } as Transaction}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("Validator A")).toBeVisible();
    expect(screen.getByText("Validator B")).toBeVisible();
  });
});
