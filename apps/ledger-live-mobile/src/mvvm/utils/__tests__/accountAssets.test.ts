import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  hasAnyFunds,
  listAccountAssets,
  listSpendableAssets,
  type AccountAsset,
} from "../accountAssets";

function withSpendable<T extends Account | TokenAccount>(account: T, spendable: number): T {
  return { ...account, spendableBalance: new BigNumber(spendable) };
}

function buildAccount(spendable: { eth: number; usdc: number; matic: number }): Account {
  const root = genAccount("account-assets", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  });
  return {
    ...withSpendable(root, spendable.eth),
    subAccounts: [
      withSpendable(genTokenAccount(0, root, usdcToken), spendable.usdc),
      withSpendable(genTokenAccount(1, root, maticEth), spendable.matic),
    ],
  };
}

const ids = (assets: readonly AccountAsset[]) => assets.map(({ currency }) => currency.id);

describe("listAccountAssets", () => {
  it("lists the coin then its tokens, each with its own account", () => {
    const account = buildAccount({ eth: 1, usdc: 1, matic: 1 });

    const assets = listAccountAssets(account, new Set());

    expect(ids(assets)).toEqual(["ethereum", usdcToken.id, maticEth.id]);
    expect(assets[0]).toEqual({ currency: account.currency, account });
    expect(assets[1]).toEqual(
      expect.objectContaining({ account: account.subAccounts?.[0], parentAccount: account }),
    );
  });

  it("leaves out blacklisted tokens", () => {
    const assets = listAccountAssets(
      buildAccount({ eth: 1, usdc: 1, matic: 1 }),
      new Set([usdcToken.id]),
    );

    expect(ids(assets)).toEqual(["ethereum", maticEth.id]);
  });
});

describe("listSpendableAssets", () => {
  it("keeps the assets with a spendable balance", () => {
    const assets = listAccountAssets(buildAccount({ eth: 0, usdc: 5, matic: 2 }), new Set());

    expect(ids(listSpendableAssets(assets))).toEqual([usdcToken.id, maticEth.id]);
  });
});

describe("hasAnyFunds", () => {
  it("is true when only a token has a spendable balance", () => {
    expect(
      hasAnyFunds(listAccountAssets(buildAccount({ eth: 0, usdc: 5, matic: 0 }), new Set())),
    ).toBe(true);
  });

  it("is false when nothing is spendable", () => {
    expect(
      hasAnyFunds(listAccountAssets(buildAccount({ eth: 0, usdc: 0, matic: 0 }), new Set())),
    ).toBe(false);
  });
});
