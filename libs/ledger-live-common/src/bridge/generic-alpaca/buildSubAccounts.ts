/*
import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { BaseTokenLikeAsset } from "./types";
import { adaptCoreOperationToLiveOperation } from "./utils";

export function buildTokenAccounts(
  tokenAssets: BaseTokenLikeAsset[],
  parentAccountId: string,
  parentCurrency: CryptoCurrency,
  tokenType: string,
  makeTokenId: (asset: BaseTokenLikeAsset) => string = defaultTokenIdGenerator,
): TokenAccount[] {
  return tokenAssets.map(asset => {
    const tokenId = makeTokenId(asset);

    const token: TokenCurrency = {
      id: tokenId,
      type: "TokenCurrency",
      name: asset.asset_code,
      ticker: asset.asset_code,
      contractAddress: `${asset.asset_issuer}:${asset.asset_code}`,
      parentCurrency,
      tokenType,
      // decimals: asset.decimals,
      units: [
        {
          name: asset.asset_code,
          code: asset.asset_code,
          magnitude: asset.decimals,
        },
      ],
    };

    const id = encodeTokenAccountId(parentAccountId, token);
    const balance = new BigNumber(asset.balance);
    const spendableBalance = balance; // could be reduced by locked amount if known

    const operations = asset.operations.map(op => adaptCoreOperationToLiveOperation(id, op));

    return {
      type: "TokenAccount",
      id,
      parentId: parentAccountId,
      token,
      balance,
      spendableBalance,
      operations,
      operationsCount: operations.length,
      pendingOperations: [],
      creationDate:
        asset.creationDate ??
        (operations.length > 0 ? operations[operations.length - 1].date : new Date()),
      swapHistory: [],
      balanceHistoryCache: emptyHistoryCache,
    };
  });
}

function defaultTokenIdGenerator(asset: BaseTokenLikeAsset): string {
  return `generic/asset/${asset.asset_issuer}/${asset.asset_code}`;
}
*/
