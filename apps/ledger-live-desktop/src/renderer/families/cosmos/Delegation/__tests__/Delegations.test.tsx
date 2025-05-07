import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { CURRENCIES_LIST } from "@ledgerhq/live-common/currencies/mock";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { RenderResult } from "@testing-library/react";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import Delegations from "../index";

// Mock the modules we need
jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

describe("Cosmos Delegations Component", () => {
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
    balance: BigNumber(10000),
    spendableBalance: BigNumber(10000),
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
      pendingRewardsBalance: BigNumber(0),
      unbondings: [],
      redelegations: [],
      delegatedBalance: BigNumber(0),
      unbondingBalance: BigNumber(0),
      withdrawAddress: "",
      sequence: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders normally when disableDelegation is not set", () => {
    // Mock the config to not have disableDelegation
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({
      // Other config options can be here
    });

    render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        ...INITIAL_STATE,
      },
    });

    // Check that the component renders something when disableDelegation is not set
    expect(getCurrencyConfiguration).toHaveBeenCalledWith(mockCosmosAccount.currency);
    expect(screen.getByText(/You can earn ATOM rewards/)).toBeVisible();
  });

  test("does not render when disableDelegation is true", async () => {
    // Mock the config to have disableDelegation set to true
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({
      disableDelegation: true,
    });

    const { container } = render(<Delegations account={mockCosmosAccount} />, {
      initialState: { ...INITIAL_STATE },
    }) as unknown as RenderResult;

    // Check that nothing is rendered
    expect(container).toBeEmptyDOMElement();
  });
});
