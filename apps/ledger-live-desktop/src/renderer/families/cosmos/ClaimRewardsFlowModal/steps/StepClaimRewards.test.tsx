import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import StepClaimRewards from "./StepClaimRewards";
import type { StepProps } from "../types";

// Mock only external deps (bridge, unit, the delegation-selector's data hook, analytics);
// the mode selector renders for real so we assert on the actual user-visible toggle.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));
jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useCosmosFamilyDelegationsQuerySelector: () => ({
    query: "",
    setQuery: jest.fn(),
    options: [],
    value: null,
  }),
}));
jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));

const buildAccount = (currencyId: string) =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById(currencyId),
    cosmosResources: { delegations: [] },
  }) as unknown as CosmosAccount;

const buildProps = (currencyId: string, mode: string): StepProps =>
  ({
    account: buildAccount(currencyId),
    parentAccount: undefined,
    transaction: { family: "cosmos", mode, validators: [] },
    status: { errors: {}, warnings: {} },
    onUpdateTransaction: jest.fn(),
    warning: null,
    error: null,
    t: (k: string) => k,
  }) as unknown as StepProps;

describe("Cosmos StepClaimRewards compound gating", () => {
  it("shows the compound option on a standard cosmos chain", () => {
    render(<StepClaimRewards {...buildProps("cosmos", "claimReward")} />);
    expect(screen.getByRole("button", { name: "Compound" })).toBeVisible();
  });

  it("hides the compound option on an epoching chain (babylon)", () => {
    render(<StepClaimRewards {...buildProps("babylon", "claimReward")} />);
    expect(screen.queryByRole("button", { name: "Compound" })).not.toBeInTheDocument();
  });
});
