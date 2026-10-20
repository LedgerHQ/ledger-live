import { BigNumber } from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { listAccountAssets, type AccountAsset } from "LLM/utils/accountAssets";
import { resolveAccountAssetsByAction } from "../resolveAccountAssetsByAction";

function withSpendable<T extends Account | TokenAccount>(account: T, spendable: number): T {
  return { ...account, spendableBalance: new BigNumber(spendable) };
}

function buildAccount(spendable: { eth: number; usdc: number; matic: number }): Account {
  const root = genAccount("account-detail-asset-actions", {
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
const all = () => true;
const none = () => false;

describe("resolveAccountAssetsByAction", () => {
  const assets = listAccountAssets(buildAccount({ eth: 0, usdc: 5, matic: 2 }), new Set());

  it("buys and swaps every supported asset, with or without balance", () => {
    const byAction = resolveAccountAssetsByAction(assets, {
      isBuyable: id => id !== maticEth.id,
      isSellable: none,
      isSwappable: all,
      isStakeable: none,
    });

    expect(ids(byAction.buy)).toEqual(["ethereum", usdcToken.id]);
    expect(ids(byAction.swap)).toEqual(["ethereum", usdcToken.id, maticEth.id]);
  });

  it("only sells supported assets with a spendable balance", () => {
    const byAction = resolveAccountAssetsByAction(assets, {
      isBuyable: none,
      isSellable: id => id !== maticEth.id,
      isSwappable: none,
      isStakeable: none,
    });

    expect(ids(byAction.sell)).toEqual([usdcToken.id]);
  });

  it("only earns on supported assets with a spendable balance", () => {
    const byAction = resolveAccountAssetsByAction(assets, {
      isBuyable: none,
      isSellable: none,
      isSwappable: none,
      isStakeable: all,
    });

    expect(ids(byAction.earn)).toEqual([usdcToken.id, maticEth.id]);
  });
});
