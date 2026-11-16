import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { useNetworkValidators } from "@domain/api-network-validators";
import type { NetworkValidator } from "@domain/entity-network-validators";
import type { CosmosAccount, TransactionStatus } from "@ledgerhq/live-common/families/cosmos/types";
import type { TFunction } from "i18next";
import ValidatorField from "../ValidatorField";

jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(),
}));

const makeValidator = (index: number, totalStaked: string): NetworkValidator => ({
  id: `validator-address-${index}`,
  address: `validator-address-${index}`,
  name: `Validator ${index}`,
  commission: 0.05,
  apy: 0.1,
  totalStaked,
});

// Listed in reverse: the field sorts them by stake.
const validators = [makeValidator(1, "1000"), makeValidator(0, "1000000")];

function renderValidatorField(currencyId: string) {
  const currency = getCryptoCurrencyById(currencyId);
  const { useAccountUnit } = jest.requireMock("~/renderer/hooks/useAccountUnit");
  useAccountUnit.mockReturnValue(currency.units[0]);
  const onChangeValidator = jest.fn();
  const account = {
    ...genAccount(`${currencyId}-test`, { currency }),
    stakingResources: { delegations: [] },
  } as unknown as CosmosAccount;

  render(
    <ValidatorField
      t={jest.fn() as unknown as TFunction}
      account={account}
      status={{ errors: {}, warnings: {} } as unknown as TransactionStatus}
      onChangeValidator={onChangeValidator}
      chosenVoteAccAddr=""
    />,
  );

  return onChangeValidator;
}

describe("Cosmos DelegationFlowModal ValidatorField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useNetworkValidators)
      .mockReturnValue({ validators, pending: false, error: undefined });
  });

  it("should select the first validator when the chain is cosmos", () => {
    const onChangeValidator = renderValidatorField("cosmos");

    expect(useNetworkValidators).toHaveBeenCalledWith("cosmos");
    expect(onChangeValidator).toHaveBeenCalledWith({ address: "validator-address-0" });
    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.queryByText("Validator 1")).not.toBeInTheDocument();
  });

  it("should list every validator and select none when the chain is babylon", () => {
    const onChangeValidator = renderValidatorField("babylon");

    expect(onChangeValidator).not.toHaveBeenCalled();
    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.getByText("Validator 1")).toBeVisible();
  });

  it("lists nothing and selects none while the validators are read", () => {
    jest
      .mocked(useNetworkValidators)
      .mockReturnValue({ validators: [], pending: true, error: undefined });
    const onChangeValidator = renderValidatorField("cosmos");

    expect(onChangeValidator).not.toHaveBeenCalled();
    expect(screen.queryByText("Validator 0")).not.toBeInTheDocument();
  });
});
