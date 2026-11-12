import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { toReceiveTarget } from "../toReceiveTarget";

const ethAccount = genAccount("receive-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const ethEntry = LegacyAccountEntrySchema.parse(
  mockAccountEntry({ legacyId: AccountIdSchema.parse(ethAccount.id) }),
);
const state = {
  accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([ethEntry])),
};

describe("toReceiveTarget", () => {
  it("should target the account with its currency when given a main account", () => {
    expect(toReceiveTarget(state, ethAccount)).toEqual({
      accountUUID: ethEntry.accountUUID,
      descriptor: ethEntry.descriptor,
      assetId: "ethereum",
    });
  });

  it("should target the parent account with the token when given a token account", () => {
    expect(toReceiveTarget(state, usdcAccount)).toEqual({
      accountUUID: ethEntry.accountUUID,
      descriptor: ethEntry.descriptor,
      assetId: usdcToken.id,
    });
  });

  it("should return undefined when the account model does not hold the account", () => {
    const unknownAccount = genAccount("receive-unknown");

    expect(toReceiveTarget(state, unknownAccount)).toBeUndefined();
  });
});
