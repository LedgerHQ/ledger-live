import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/index";
import { fetchAllTokenBalances, fetchBalances } from "../network/api";
import { getStakes } from "./getStakes";

export const NATIVE_ASSET: AssetInfo = { type: "native", name: "STX" };

export const tokenAsset = (tokenId: string, owner: string): AssetInfo => ({
  type: "token",
  assetReference: tokenId,
  assetOwner: owner,
  name: tokenId,
});

/** Native STX (incl. locked/stake position) + all SIP-010 token balances for `address`. */
export async function getBalance(address: string): Promise<Balance[]> {
  const [stx, tokens] = await Promise.all([fetchBalances(address), fetchAllTokenBalances(address)]);

  const locked = BigInt(stx.locked || "0");
  const nativeBalance: Balance = {
    value: BigInt(stx.balance || "0"),
    asset: NATIVE_ASSET,
  };

  if (locked > 0n) {
    const { items } = await getStakes(address);
    nativeBalance.locked = locked;
    nativeBalance.stake = items[0];
  }

  const tokenBalances: Balance[] = Object.entries(tokens).map(([tokenId, balance]) => ({
    value: BigInt(balance || "0"),
    asset: tokenAsset(tokenId, address),
  }));

  return [nativeBalance, ...tokenBalances];
}
