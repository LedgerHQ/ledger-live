import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";
import { getAssetIdFromAsset } from "./tokens";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";

export async function getBalance(addr: string): Promise<Balance[]> {
  const { balance, assets, spendableBalance } = await fetchAccount(addr);
  const nativeRes = [
    {
      value: BigInt(balance.toString()),
      asset: { type: "native" as const },
      spendableBalance: BigInt(spendableBalance.toString()),
    },
  ];
  if (assets && assets.length > 0) {
    const assetBalances = assets
      .filter(asset => findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`))
      .map(asset => {
        const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`)!;
        const formattedBalance = parseCurrencyUnit(token.units[0], asset.balance || "0");
        return {
          value: BigInt(formattedBalance.toString()),
          asset: {
            type: "token" as const,
            assetReference: asset.asset_code,
            assetOwner: asset.asset_issuer,
          },
          spendableBalance: BigInt(spendableBalance.toString()),
        };
      });
    return [...nativeRes, ...assetBalances];
  }
  return [...nativeRes];
}
