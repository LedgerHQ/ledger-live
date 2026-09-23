import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import StepStarter from "./StepStarter";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("@ledgerhq/live-common/families/cosmos/chain", () => ({
  __esModule: true,
  default: jest.fn(() => ({ unbondingPeriod: 21 })),
}));

import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain";

const buildProps = (): StepProps =>
  ({
    account: {
      type: "Account",
      currency: getCryptoCurrencyById("cosmos"),
    } as unknown as CosmosAccount,
    transaction: { family: "cosmos", mode: "redelegate" } as Transaction,
  }) as unknown as StepProps;

describe("Cosmos Redelegation StepStarter", () => {
  it("renders without throwing when account and transaction are present", () => {
    expect(() => render(<StepStarter {...buildProps()} />)).not.toThrow();
  });

  it("looks up the unbonding period from the chain factory by currency id", () => {
    render(<StepStarter {...buildProps()} />);
    expect(cryptoFactory).toHaveBeenCalledWith("cosmos");
  });

  it("displays the unbonding period from the chain factory in the description", () => {
    render(<StepStarter {...buildProps()} />);
    expect(screen.getByText(/21-day timelock/)).toBeVisible();
  });
});
