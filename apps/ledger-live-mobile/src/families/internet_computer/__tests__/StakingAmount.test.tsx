import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import React from "react";
import StakingAmount from "../StakingFlow/Amount";
import { ICP_UNIT, makeICPAccount } from "./testUtils";

// 12.34567891 ICP: the fifth decimal rounds up, so the default six-significant-digit format would
// report a maximum above the balance the bridge will actually accept.
const MAX_SPENDABLE = new BigNumber("1234567891");

jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: makeICPAccount({ neurons: [] }), parentAccount: null }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ estimateMaxSpendable: async () => MAX_SPENDABLE }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: { family: "internet_computer", type: "create_neuron", amount: new BigNumber(0) },
    updateTransaction: jest.fn(),
    status: { errors: {}, warnings: {} },
    bridgePending: false,
  }),
}));

describe("StakingAmount", () => {
  // A displayed bound must be a value the canister would accept: a rounded-up maximum invites the
  // user to type back a figure the bridge then rejects.
  it("shows the spendable maximum unrounded", async () => {
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <StakingAmount navigation={{} as any} route={{ params: {} } as any} />,
    );

    expect(await screen.findByText("12.34567891 ICP")).toBeVisible();
    expect(screen.queryByText("12.3457 ICP")).toBeNull();
  });
});
