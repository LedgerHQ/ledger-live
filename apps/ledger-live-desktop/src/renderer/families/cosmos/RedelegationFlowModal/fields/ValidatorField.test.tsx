import React from "react";
import { render, screen } from "tests/testSetup";
import { useNetworkValidators } from "@domain/api-network-validators";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import ValidatorField from "./ValidatorField";

jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));

const VALIDATOR_A: NetworkValidator = { id: "validatorA", name: "Validator A", totalStaked: "2" };
const VALIDATOR_B: NetworkValidator = { id: "validatorB", name: "Validator B", totalStaked: "1" };
const LEDGER: NetworkValidator = { id: "ledger", name: "Ledger", totalStaked: "0", ledger: true };

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("cosmos"),
  stakingResources: { delegations: [] },
} as unknown as CosmosAccount;

const redelegateFrom = (valAddress?: string) =>
  ({ family: "cosmos", mode: "redelegate", valAddress }) as Transaction;

const listedNames = () => screen.getAllByText(/^(Validator [AB]|Ledger)$/).map(e => e.textContent);

describe("Cosmos Redelegation ValidatorField", () => {
  beforeEach(() => {
    jest.mocked(useNetworkValidators).mockReturnValue({
      validators: [VALIDATOR_A, VALIDATOR_B],
      pending: false,
      error: undefined,
    });
  });

  it("excludes the source validator (transaction.valAddress) from the destination list", () => {
    render(
      <ValidatorField
        account={account}
        transaction={redelegateFrom("validatorA")}
        onChange={jest.fn()}
      />,
    );
    expect(useNetworkValidators).toHaveBeenCalledWith("cosmos");
    expect(screen.queryByText("Validator A")).not.toBeInTheDocument();
    expect(screen.getByText("Validator B")).toBeVisible();
  });

  it("shows all validators when the transaction has no source validator set", () => {
    render(
      <ValidatorField account={account} transaction={redelegateFrom()} onChange={jest.fn()} />,
    );
    expect(screen.getByText("Validator A")).toBeVisible();
    expect(screen.getByText("Validator B")).toBeVisible();
  });

  it("lists the Ledger validator first, then by stake", () => {
    jest.mocked(useNetworkValidators).mockReturnValue({
      validators: [VALIDATOR_B, LEDGER, VALIDATOR_A],
      pending: false,
      error: undefined,
    });
    render(
      <ValidatorField account={account} transaction={redelegateFrom()} onChange={jest.fn()} />,
    );
    expect(listedNames()).toEqual(["Ledger", "Validator A", "Validator B"]);
  });
});
