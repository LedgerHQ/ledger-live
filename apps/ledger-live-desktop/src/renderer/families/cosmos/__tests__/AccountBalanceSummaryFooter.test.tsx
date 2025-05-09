import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { CURRENCIES_LIST } from "@ledgerhq/live-common/currencies/mock";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

// Mock necessary modules
jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

jest.mock("@ledgerhq/coin-cosmos/network/Cosmos", () => ({
  CosmosAPI: jest.fn(),
}));

describe("Cosmos AccountBalanceSummaryFooter Component", () => {
  // Create a mock Cosmos account
  const mockCosmosAccount: CosmosAccount = {
    type: "Account",
    id: "mock-cosmos-account",
    seedIdentifier: "mock-seed-identifier",
    derivationMode: "",
    index: 0,
    freshAddress: "mock-fresh-address",
    freshAddressPath: "mock-fresh-address-path",
    used: false,
    currency: CURRENCIES_LIST.find(c => c.id === "cosmos")!,
    balance: new BigNumber(10000),
    spendableBalance: new BigNumber(5000),
    blockHeight: 0,
    lastSyncDate: new Date(),
    creationDate: new Date(),
    operations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    operationsCount: 0,
    pendingOperations: [],
    swapHistory: [],
    cosmosResources: {
      delegations: [],
      pendingRewardsBalance: new BigNumber(0),
      unbondings: [],
      redelegations: [],
      delegatedBalance: new BigNumber(2000),
      unbondingBalance: new BigNumber(3000),
      withdrawAddress: "",
      sequence: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders with delegation sections when disableDelegation is not set", async () => {
    // Mock the config to not have disableDelegation
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({});

    render(<AccountBalanceSummaryFooter account={mockCosmosAccount} />, {
      initialState: {
        ...INITIAL_STATE,
      },
    });

    // Check available balance section
    expect(screen.getByText("Available balance")).toBeInTheDocument();

    // Check delegated assets section is present
    expect(screen.getByText("Delegated assets")).toBeInTheDocument();

    // Check unbonding section is present (since _unbondingBalance > 0)
    expect(screen.getByText("Undelegating")).toBeInTheDocument();
  });

  test("does not render delegation sections when disableDelegation is true", async () => {
    // Mock the config to have disableDelegation set to true
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({
      disableDelegation: true,
    });

    render(<AccountBalanceSummaryFooter account={mockCosmosAccount} />, {
      initialState: {
        ...INITIAL_STATE,
      },
    });

    // Check available balance section is still present
    expect(screen.getByText("Available balance")).toBeInTheDocument();

    // Check delegated assets section is NOT present
    expect(screen.queryByText("Delegated assets")).not.toBeInTheDocument();

    // Check unbonding section is NOT present, even though _unbondingBalance > 0
    expect(screen.queryByText("Undelegating")).not.toBeInTheDocument();
  });
});
