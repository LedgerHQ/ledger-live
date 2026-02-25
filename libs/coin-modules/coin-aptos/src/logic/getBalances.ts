import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import { APTOS_ASSET_ID, TOKEN_TYPE } from "../constants";
import type { AptosAPI } from "../network";

export async function getBalances(
  aptosClient: AptosAPI,
  address: string,
  contract_address?: string,
): Promise<Balance[]> {
  const balances = await aptosClient.getBalances(address, contract_address);
  return balances.length !== 0
    ? balances.map(balance => {
        const isNative = balance.contractAddress === APTOS_ASSET_ID;
        const type =
          balance.contractAddress.split("::").length === 3
            ? TOKEN_TYPE.COIN
            : TOKEN_TYPE.FUNGIBLE_ASSET;

        return {
          value: BigInt(balance.amount.toString()),
          asset: isNative
            ? { type: "native" }
            : { type: type, assetReference: balance.contractAddress },
        };
      })
    : [
        {
          value: BigInt(0),
          asset: { type: "native" },
        },
      ];
}
