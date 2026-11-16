import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { useAccountData } from "@features/platform-account-data";
import { AccountIdSchema, accountsSlice, initialAccountsState } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { AccountAssetBalanceSchema } from "@domain/entity-account-balance";
import { mockTronResources } from "@domain/entity-account-tron/schema.mock";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

jest.mock("@features/platform-account-data", () => ({
  useAccountData: jest.fn(() => ({ accountUUID: undefined, pending: false })),
}));

const zero = new BigNumber(0);
const account: TronAccount = {
  ...genAccount("tron-footer", { currency: getCryptoCurrencyById("tron") }),
  spendableBalance: new BigNumber(3_000_000),
  tronResources: {
    frozen: { bandwidth: null, energy: null },
    unFrozen: { bandwidth: null, energy: null },
    delegatedFrozen: { bandwidth: null, energy: null },
    legacyFrozen: { bandwidth: null, energy: null },
    votes: [],
    tronPower: 0,
    energy: zero,
    bandwidth: { freeUsed: zero, freeLimit: zero, gainedUsed: zero, gainedLimit: zero },
    unwithdrawnReward: zero,
    lastWithdrawnRewardDate: null,
    lastVotedDate: null,
  },
};
const descriptor = fromLegacyAccount(account);
const accountUUID = computeAccountUUID(descriptor);

const accountEntries = accountsSlice.reducer(
  initialAccountsState,
  accountsSlice.actions.legacyAccountsSynced([
    { accountUUID, descriptor, legacyId: AccountIdSchema.parse(account.id) },
  ]),
);

const nativeRow = AccountAssetBalanceSchema.parse({
  assetId: "tron",
  balance: "10000000",
  spendableBalance: "3000000",
  locked: [
    { reason: "frozen", amount: "5000000" },
    { reason: "unbonding", amount: "2000000" },
  ],
});

const tronResources = mockTronResources({
  energy: "1200",
  bandwidth: { freeUsed: "100", freeLimit: "600", gainedUsed: "30", gainedLimit: "200" },
});

const renderFooter = (initialState: Record<string, unknown>) =>
  render(<AccountBalanceSummaryFooter account={account} />, {
    initialState: { accountEntries, ...initialState },
  });

describe("Tron AccountBalanceSummaryFooter", () => {
  it("reads the balance and the Tron resources of the account's descriptor", () => {
    renderFooter({});
    expect(useAccountData).toHaveBeenCalledWith("balance", descriptor);
    expect(useAccountData).toHaveBeenCalledWith("tron:resources", descriptor);
  });

  it("shows the frozen and unfreezing TRX, the bandwidth left and the energy", () => {
    renderFooter({
      accountBalances: { [accountUUID]: [nativeRow] },
      accountTron: { [accountUUID]: { revision: 0, resources: tronResources } },
    });
    expect(screen.getByText("7 TRX")).toBeVisible();
    expect(screen.getByText("670")).toBeVisible();
    expect(screen.getByText("1200")).toBeVisible();
  });

  it("shows placeholders until the account is read", () => {
    renderFooter({});
    expect(screen.getAllByText("–")).toHaveLength(3);
  });
});
