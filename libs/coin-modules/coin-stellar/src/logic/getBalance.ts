import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";
import { StellarAsset } from "../types";
import { getAssetIdFromAsset } from "./tokens";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";

export async function getBalance(addr: string): Promise<Balance<StellarAsset>[]> {
  const { balance, assets } = await fetchAccount(addr);
  const nativeRes = [{ value: BigInt(balance.toString()), asset: { type: "native" as const } }];
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
            assetCode: asset.asset_code,
            assetIssuer: asset.asset_issuer,
          },
        };
      });
    return [...nativeRes, ...assetBalances];
  }
  return [...nativeRes];
}
