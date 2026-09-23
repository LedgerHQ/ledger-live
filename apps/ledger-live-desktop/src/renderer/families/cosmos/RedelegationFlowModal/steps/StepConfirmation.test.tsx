import React from "react";
import { act, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import StepConfirmation from "./StepConfirmation";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
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
    transaction: {
      family: "cosmos",
      mode: "redelegate",
      dstValAddress: "validatorA",
    } as Transaction,
    source: "Account Page",
    signed: false,
    error: null,
    optimisticOperation: null,
    ...overrides,
  }) as unknown as StepProps;

describe("Cosmos Redelegation StepConfirmation", () => {
  beforeEach(() => {
    mockedTrack.mockClear();
  });

  it("tracks staking_completed using the transaction's destination validator once broadcasted", () => {
    act(() => {
      render(<StepConfirmation {...buildProps({ optimisticOperation: buildOperation() })} />);
    });
    expect(mockedTrack).toHaveBeenCalledWith(
      "staking_completed",
      expect.objectContaining({
        validator: "Validator A",
        delegation: "redelegation",
      }),
    );
  });

  it("falls back to the raw address when the destination validator isn't in the preloaded list", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: {
              family: "cosmos",
              mode: "redelegate",
              dstValAddress: "unknown-address",
            } as Transaction,
          })}
        />,
      );
    });
    expect(mockedTrack).toHaveBeenCalledWith(
      "staking_completed",
      expect.objectContaining({ validator: "unknown-address" }),
    );
  });

  it("does not track when the transaction has no destination validator", () => {
    act(() => {
      render(
        <StepConfirmation
          {...buildProps({
            optimisticOperation: buildOperation(),
            transaction: { family: "cosmos", mode: "redelegate" } as Transaction,
          })}
        />,
      );
    });
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("renders the success view once the operation is broadcasted", () => {
    act(() => {
      render(<StepConfirmation {...buildProps({ optimisticOperation: buildOperation() })} />);
    });
    expect(screen.getByText("You have successfully redelegated your assets")).toBeVisible();
  });
});
