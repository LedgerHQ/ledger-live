import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import StepConfirmation from "./Confirmation";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncOneAccountOnMount: () => null,
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));

const VALIDATOR_A = { validatorAddress: "validatorA", name: "Validator A" };

jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useCosmosFamilyPreloadData: () => ({ validators: [VALIDATOR_A] }),
}));

const buildAccount = (): CosmosAccount =>
  ({
    type: "Account",
    currency: getCryptoCurrencyById("cosmos"),
  }) as unknown as CosmosAccount;

const buildOperation = (): Operation =>
  ({
    id: "op-1",
    accountId: "cosmos-account-1",
  }) as unknown as Operation;

const buildProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    account: buildAccount(),
    transaction: {
      family: "cosmos",
      mode: "undelegate",
      valAddress: "validatorA",
      amount: BigNumber(100),
    } as Transaction,
    signed: false,
    error: null,
    optimisticOperation: null,
    ...overrides,
  }) as unknown as StepProps;

describe("Cosmos Undelegation StepConfirmation", () => {
  it("resolves the undelegated validator's name from the transaction's valAddress", () => {
    act(() => {
      render(<StepConfirmation {...buildProps({ optimisticOperation: buildOperation() })} />);
    });
    expect(screen.getByText(/Validator A/)).toBeVisible();
  });

  it("renders no validator name when the transaction has no valAddress", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: { family: "cosmos", mode: "undelegate" } as Transaction,
          })}
        />,
      );
    });
    expect(screen.queryByText(/Validator A/)).not.toBeInTheDocument();
  });
});
