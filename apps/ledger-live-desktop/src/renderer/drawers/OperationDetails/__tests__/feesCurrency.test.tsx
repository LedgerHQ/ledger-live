import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { Account, Operation } from "@ledgerhq/types-live";
import { importLLDCoinFamily } from "~/renderer/families";
import { OperationDetails } from "..";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

const mockUseFindTokenByAddressInCurrencyQuery = jest.fn();
jest.mock("@domain/api-currency-token", () => ({
  ...jest.requireActual("@domain/api-currency-token"),
  useFindTokenByAddressInCurrencyQuery: (...args: unknown[]) =>
    mockUseFindTokenByAddressInCurrencyQuery(...args),
}));

beforeAll(async () => {
  await importLLDCoinFamily("celo");
});

const USDT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";
const celo = getCryptoCurrencyById("celo");
const usdt: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("celo/erc20/usdt"),
  contractAddress: USDT,
  parentCurrencyId: celo.id,
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};

const ACCOUNT_ID = "js:2:celo:0xabc:";
// A transaction whose only effect is a fee of 0.001601 USDT
const operation = {
  id: "op-1",
  hash: "0xhash",
  type: "NONE",
  value: new BigNumber(0),
  fee: new BigNumber(1601),
  senders: ["0xabc"],
  recipients: [USDT],
  blockHash: "hash",
  blockHeight: 90,
  date: new Date(),
  accountId: ACCOUNT_ID,
  extra: { feeAsset: USDT },
} as unknown as Operation;

const account = {
  ...createFixtureAccount(),
  id: ACCOUNT_ID,
  currency: celo,
  blockHeight: 1000,
  operations: [operation],
  pendingOperations: [],
  subAccounts: [],
  celoResources: {
    registrationStatus: false,
    lockedBalance: new BigNumber(0),
    nonvotingLockedBalance: new BigNumber(0),
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: new BigNumber(0),
  },
} as unknown as Account;

const renderDrawer = () =>
  render(<OperationDetails operationId={operation.id} accountId={account.id} />, {
    initialState: { accounts: [account] },
  });

describe("OperationDetails fee of a Celo transaction paid in a token", () => {
  it("shows the fee in the token once the token is resolved", async () => {
    mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({ data: usdt });

    renderDrawer();

    await screen.findByTestId("status-drawer");
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getByText(/0\.001601\s*USDT/)).toBeInTheDocument();
  });

  it("shows no fee while the token is unresolved, rather than one in CELO", async () => {
    mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({ data: undefined });

    renderDrawer();

    await screen.findByTestId("status-drawer");
    expect(screen.queryByText("Fee")).not.toBeInTheDocument();
    expect(screen.queryByText(/CELO/)).not.toBeInTheDocument();
  });
});
