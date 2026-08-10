import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/index";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { getAccount } from "../../network";

export const NATIVE_ASSET: AssetInfo = { type: "native", name: "VET" };

// `assetOwner` lets the generic coin-framework adapter attach the VTHO balance to its sub-account
// (buildSubAccounts filters by `extra.assetReference` + `extra.assetOwner`). Mirrors coin-tron.
export const vthoAsset = (address: string): AssetInfo => ({
  type: "token",
  assetReference: VTHO_ADDRESS,
  assetOwner: address,
  name: "VTHO",
});

// VET + VTHO balances from Thor's /accounts/{address} (both returned in one call); 0 if absent.
export async function getBalance(address: string): Promise<Balance[]> {
  const { balance, energy } = await getAccount(address);

  return [
    { value: BigInt(balance || "0"), asset: NATIVE_ASSET },
    { value: BigInt(energy || "0"), asset: vthoAsset(address) },
  ];
}
