import { Balance } from "@ledgerhq/coin-framework/api/types";
import { fetchAccount } from "../network";

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
  /**
   * https://developers.stellar.org/docs/data/apis/horizon/api-reference/retrieve-an-account
   * `asset.balance` matches [0-9]+\.[0-9]{7}
   * NOTE `Math.floor` is still needed
   * > Number.parseFloat('0.1468328') * 10 ** 7
   * 1468328.0000000002
   */
  const assetBalances: Balance[] = assets.map(asset => ({
    value: BigInt(Math.floor(Number.parseFloat(asset.balance) * 10 ** 7)),
    asset: {
      type: asset.asset_type,
      assetReference: asset.asset_code,
      assetOwner: asset.asset_issuer,
    },
  }));

  return [...nativeRes, ...assetBalances];
}
