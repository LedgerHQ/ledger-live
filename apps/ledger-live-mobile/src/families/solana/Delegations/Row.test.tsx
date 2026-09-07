import React from "react";
import BigNumber from "bignumber.js";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import type { Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import type { SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import DelegationRow from "./Row";

const unit = { code: "SOL", name: "SOL", magnitude: 9 } as Unit;
const currency = {
  id: "solana",
  ticker: "SOL",
  units: [unit],
} as unknown as Currency;

const stakeWithMeta = (
  stake: Record<string, unknown>,
  meta: Record<string, unknown> = {},
): SolanaStakeWithMeta => ({ stake, meta }) as unknown as SolanaStakeWithMeta;

const bondedStake = {
  positionId: "stake-acc-1",
  validatorAddress: "vote-acc-1",
  status: "bonded",
  pendingRewards: new BigNumber(0),
  amount: new BigNumber(2_000_000_000),
  activeAmount: new BigNumber(2_000_000_000),
};

const renderRow = (item: SolanaStakeWithMeta) =>
  render(
    <DelegationRow stakeWithMeta={item} currency={currency} unit={unit} onPress={jest.fn()} />,
  );

describe("solana Delegations Row", () => {
  it("shows the validator name when the metadata carries one", () => {
    renderRow(stakeWithMeta(bondedStake, { validator: { name: "Ledger Validator" } }));

    expect(screen.getByText("Ledger Validator")).toBeVisible();
  });

  it("falls back to the validator address when there is no metadata name", () => {
    renderRow(stakeWithMeta(bondedStake));

    expect(screen.getByText("vote-acc-1")).toBeVisible();
  });

  it("falls back to a placeholder when the position has no validator at all", () => {
    renderRow(stakeWithMeta({ ...bondedStake, validatorAddress: "" }));

    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("shows the delegated amount of an active position", () => {
    renderRow(stakeWithMeta(bondedStake));

    expect(screen.getByText("2 SOL")).toBeVisible();
  });

  it("shows the withdrawable amount when nothing is delegated any more", () => {
    renderRow(
      stakeWithMeta({
        ...bondedStake,
        amount: new BigNumber(0),
        withdrawableAmount: new BigNumber(1_500_000_000),
      }),
    );

    expect(screen.getByText("1.5 SOL")).toBeVisible();
  });
});
