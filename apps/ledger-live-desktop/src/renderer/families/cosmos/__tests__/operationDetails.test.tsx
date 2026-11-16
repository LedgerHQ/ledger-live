import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { useNetworkValidators } from "@domain/api-network-validators";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import type { CosmosAccount, CosmosOperation } from "@ledgerhq/live-common/families/cosmos/types";
import operationDetails from "../operationDetails";

jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));

const { OperationDetailsExtra } = operationDetails;

const SOURCE: NetworkValidator = { id: "cosmosvaloper1source", name: "Source Validator" };
const DESTINATION: NetworkValidator = { id: "cosmosvaloper1dest", name: "Destination Validator" };

const account = {
  type: "Account",
  currency: getCryptoCurrencyById("cosmos"),
} as unknown as CosmosAccount;

const redelegation = {
  type: "REDELEGATE",
  extra: {
    sourceValidator: SOURCE.id,
    validators: [{ address: DESTINATION.id, amount: BigNumber(1000000) }],
  },
} as unknown as CosmosOperation;

const mockValidators = (validators: NetworkValidator[]) =>
  jest
    .mocked(useNetworkValidators)
    .mockReturnValue({ validators, pending: false, error: undefined });

describe("Cosmos OperationDetailsExtra", () => {
  it("names the validators from the network validators", () => {
    mockValidators([SOURCE, DESTINATION]);
    render(<OperationDetailsExtra operation={redelegation} account={account} type="REDELEGATE" />);
    expect(useNetworkValidators).toHaveBeenCalledWith("cosmos");
    expect(screen.getByText("Source Validator")).toBeVisible();
    expect(screen.getByText("Destination Validator")).toBeVisible();
  });

  it("shows the addresses while the validators are not loaded", () => {
    mockValidators([]);
    render(<OperationDetailsExtra operation={redelegation} account={account} type="REDELEGATE" />);
    expect(screen.getByText(SOURCE.id)).toBeVisible();
    expect(screen.getByText(DESTINATION.id)).toBeVisible();
  });
});
