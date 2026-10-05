import React from "react";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import type { StepProps } from "../types";

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackPage: () => null,
}));
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  __esModule: true,
  SyncOneAccountOnMount: () => null,
}));

const VALIDATOR_A = { validatorAddress: "validatorA", name: "Validator A" };

jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useLedgerFirstShuffledValidatorsCosmosFamily: () => [VALIDATOR_A],
}));

const mockedTrack = track as jest.Mock;

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
    t: (k: string) => k,
    account: buildAccount(),
    transaction: { family: "cosmos", mode: "delegate", valAddress: "validatorA" } as Transaction,
    source: "Account Page",
    signed: false,
    error: null,
    optimisticOperation: null,
    ...overrides,
  }) as unknown as StepProps;

describe("Cosmos Delegation StepConfirmation", () => {
  beforeEach(() => {
    mockedTrack.mockClear();
  });

  it("tracks staking_completed using the transaction's chosen validator once broadcasted", () => {
    act(() => {
      render(<StepConfirmation {...buildProps({ optimisticOperation: buildOperation() })} />);
    });
    expect(mockedTrack).toHaveBeenCalledWith(
      "staking_completed",
      expect.objectContaining({ validator: "Validator A", delegation: "delegation" }),
    );
  });

  it("does not track when the transaction has no chosen validator", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: { family: "cosmos", mode: "delegate" } as Transaction,
          })}
        />,
      );
    });
    expect(mockedTrack).not.toHaveBeenCalled();
  });
});

describe("Cosmos Delegation StepConfirmationFooter", () => {
  it("shows the success CTA when the transaction has a chosen validator", () => {
    render(<StepConfirmationFooter {...buildProps({ optimisticOperation: buildOperation() })} />);
    expect(screen.getByText("View details")).toBeVisible();
  });

  it("hides the success CTA when the transaction has no chosen validator", () => {
    render(
      <StepConfirmationFooter
        {...buildProps({
          optimisticOperation: buildOperation(),
          transaction: { family: "cosmos", mode: "delegate" } as Transaction,
        })}
      />,
    );
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
  });
});
