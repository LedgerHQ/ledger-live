import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
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
const ETHEREUM = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const USDC = CryptoOrTokenCurrencyIdSchema.parse(usdcToken.id);

describe("toReceiveTarget", () => {
  it("should target the account and the given asset", () => {
    expect(toReceiveTarget(state, ethAccount.id, ETHEREUM)).toEqual({
      accountUUID: ethEntry.accountUUID,
      descriptor: ethEntry.descriptor,
      assetId: ETHEREUM,
    });
  });

  it("should target another asset of the same account", () => {
    expect(toReceiveTarget(state, ethAccount.id, USDC)).toEqual({
      accountUUID: ethEntry.accountUUID,
      descriptor: ethEntry.descriptor,
      assetId: USDC,
    });
  });

  it("should return undefined for a token account id, which is not a main account id", () => {
    expect(toReceiveTarget(state, usdcAccount.id, USDC)).toBeUndefined();
  });

  it("should return undefined when the account model does not hold the account", () => {
    const unknownAccount = genAccount("receive-unknown");

    expect(toReceiveTarget(state, unknownAccount.id, ETHEREUM)).toBeUndefined();
  });
});
