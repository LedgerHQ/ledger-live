import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import * as cosmosReact from "@ledgerhq/live-common/families/cosmos/react";
import type {
  CosmosValidatorItem,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { TFunction } from "i18next";
import ValidatorField from "../ValidatorField";

jest.mock("@ledgerhq/live-common/families/cosmos/react");
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(),
}));

const makeValidator = (index: number): CosmosValidatorItem => ({
  validatorAddress: `validator-address-${index}`,
  name: `Validator ${index}`,
  votingPower: 1,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.1,
  tokens: "1000000",
});

const validators = [makeValidator(0), makeValidator(1)];

function renderValidatorField(currencyId: string) {
  const currency = getCryptoCurrencyById(currencyId);
  const { useAccountUnit } = jest.requireMock("~/renderer/hooks/useAccountUnit");
  useAccountUnit.mockReturnValue(currency.units[0]);
  const onChangeValidator = jest.fn();

  render(
    <ValidatorField
      t={jest.fn() as unknown as TFunction}
      account={genAccount(`${currencyId}-test`, { currency })}
      status={{ errors: {}, warnings: {} } as unknown as TransactionStatus}
      delegations={[]}
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
      .mocked(cosmosReact.useLedgerFirstShuffledValidatorsCosmosFamily)
      .mockReturnValue(validators);
  });

  it("should select the first validator when the chain is cosmos", () => {
    const onChangeValidator = renderValidatorField("cosmos");

    expect(onChangeValidator).toHaveBeenCalledWith({ address: validators[0].validatorAddress });
    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.queryByText("Validator 1")).not.toBeInTheDocument();
  });

  it("should list every validator and select none when the chain is babylon", () => {
    const onChangeValidator = renderValidatorField("babylon");

    expect(onChangeValidator).not.toHaveBeenCalled();
    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.getByText("Validator 1")).toBeVisible();
  });
});
