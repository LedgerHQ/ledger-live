import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { accountRefOf } from "./account-data-setup";

const ethereum = getCryptoCurrencyById("ethereum");

const account = {
  type: "Account",
  id: "js:2:ethereum:0xabc:",
  seedIdentifier: "0xabc",
  derivationMode: "",
  index: 0,
  freshAddress: "0xABC",
  freshAddressPath: "44'/60'/0'/0/0",
  used: true,
  balance: new BigNumber("1"),
  spendableBalance: new BigNumber("1"),
  creationDate: new Date(),
  blockHeight: 1,
  currency: ethereum,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {},
  swapHistory: [],
} as unknown as Account;

const tokenAccount = {
  type: "TokenAccount",
  id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
  parentId: account.id,
  token: { id: "ethereum/erc20/usd__coin", parentCurrencyId: "ethereum" },
  balance: new BigNumber("5"),
  spendableBalance: new BigNumber("5"),
} as unknown as TokenAccount;

describe("accountRefOf", () => {
  it("carries the account id, currency and fresh address", () => {
    expect(accountRefOf(account)).toEqual({
      accountId: account.id,
      currencyId: "ethereum",
      address: "0xABC",
      derivationMode: "",
    });
  });

  it("falls back to the id's xpub when no fresh address is known", () => {
    expect(accountRefOf({ ...account, freshAddress: "" }).address).toBe("0xabc");
  });

  it("resolves a token account against its parent's address and currency", () => {
    expect(accountRefOf(tokenAccount, account)).toEqual({
      accountId: tokenAccount.id,
      currencyId: "ethereum",
      address: "0xABC",
      derivationMode: "",
      parentId: account.id,
    });
  });

  it("leaves parentId unset on a main account", () => {
    expect(accountRefOf(account).parentId).toBeUndefined();
  });
});
