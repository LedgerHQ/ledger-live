import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import type { AptosAPI } from "../network";
import { APTOS_ASSET_ID } from "../constants";

export async function getBalance(
  aptosClient: AptosAPI,
  address: string,
  contract_address?: string,
): Promise<Balance<AptosAsset>[]> {
  const balances = await aptosClient.getBalances(address, contract_address);

  return balances.map(balance => {
    const isNative = balance.asset_type === APTOS_ASSET_ID;

    return {
      value: BigInt(balance.amount.toString()),
      asset: isNative ? { type: "native" } : { type: "token", asset_type: balance.asset_type },
    };
  });

  /*
    - Contract address Add to getBalances and when having value should use Contract Address otherwise should not filter by asset type. 
    
    - When having balance: if its a type == APTOS_ASSET_ID (and legacy?) or A Token.
      -- Se for nativo: nao preencher o asset_type
      -- Se for token: preencher o asset_type com o token_id

    - AptosAsset should extend a new Asset type and 
      export type AptosAsset = Asset<{ asset_type: string; }>;


    - Check for tests: Covering scenarios 


  */
}
