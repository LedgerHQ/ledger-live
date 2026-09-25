import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import StepConfirmation from "./StepConfirmation";
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
      mode: "claimReward",
      valAddress: "validatorA",
      amount: BigNumber(100),
    } as Transaction,
    signed: false,
    error: null,
    optimisticOperation: null,
    ...overrides,
  }) as unknown as StepProps;

describe("Cosmos ClaimRewards StepConfirmation", () => {
  it("shows the claim-only success copy when mode is claimReward", () => {
    act(() => {
      render(<StepConfirmation {...buildProps({ optimisticOperation: buildOperation() })} />);
    });
    expect(screen.getByText("Rewards cashed in successfully")).toBeVisible();
  });

  it("shows the compound success copy, including the resolved validator name, when mode is compoundReward", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: {
              family: "cosmos",
              mode: "compoundReward",
              valAddress: "validatorA",
              amount: BigNumber(100),
            } as Transaction,
          })}
        />,
      );
    });
    expect(screen.getByText("Rewards compounded successfully")).toBeVisible();
    expect(screen.getByText("Validator A")).toBeVisible();
  });

  it("renders no validator name in compound mode when the transaction has no valAddress", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: {
              family: "cosmos",
              mode: "compoundReward",
              amount: BigNumber(0),
            } as Transaction,
          })}
        />,
      );
    });
    expect(screen.queryByText("Validator A")).not.toBeInTheDocument();
  });
});
