import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { getAssetIdFromAsset } from "./utils";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import BigNumber from "bignumber.js";

export async function getBalance(addr: string): Promise<Balance[]> {
  const { balance, assets, spendableBalance } = await fetchAccount(addr);
  const locked = BigInt(balance.toString()) - BigInt(spendableBalance.toString());
  const nativeRes = [
    {
      value: BigInt(balance.toString()),
      asset: { type: "native" as const },
      locked: locked, // locked balance is the difference between native balance and spendable balance
    },
  ];
  if (!assets || assets.length === 0) {
    return nativeRes;
  }
  const assetBalances: Balance[] = assets.map(asset => {
    const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`);
    let parsedBalance = new BigNumber(0);
    if (token) {
      parsedBalance = parseCurrencyUnit(token.units[0], asset.balance);
    }
    // NOTE: parse as-is (assumed decimal string), caller should decide how to render
    const intBalance = BigInt(Math.floor(parseFloat(parsedBalance.toString()))); // 7 decimals, per Stellar convention
    return {
      value: intBalance,
      asset: {
        type: asset.asset_type,
        assetReference: asset.asset_code,
        assetOwner: asset.asset_issuer,
      },
    };
  });

  return [...nativeRes, ...assetBalances];
}
