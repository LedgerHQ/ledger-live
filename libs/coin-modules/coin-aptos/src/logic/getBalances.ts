import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import type { AptosAPI } from "../network";
import { APTOS_ASSET_ID, TOKEN_TYPE } from "../constants";

export async function getBalances(
  aptosClient: AptosAPI,
  address: string,
  contract_address?: string,
): Promise<Balance<AptosAsset>[]> {
  const balances = await aptosClient.getBalances(address, contract_address);

  return balances.map(balance => {
    const isNative = balance.contractAddress === APTOS_ASSET_ID;
    const standard =
      balance.contractAddress.split("::").length === 3
        ? TOKEN_TYPE.COIN
        : TOKEN_TYPE.FUNGIBLE_ASSET;

    return {
      value: BigInt(balance.amount.toString()),
      asset: isNative
        ? { type: "native" }
        : { type: "token", contractAddress: balance.contractAddress, standard: standard },
    };
  });
}
