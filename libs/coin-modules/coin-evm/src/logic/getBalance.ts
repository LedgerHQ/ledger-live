import type { Balance, AssetInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { getNodeApi } from "../network/node";
import { getExplorerApi } from "../network/explorer";
import { NodeApi } from "../network/node/types";
import { ExplorerApi } from "../network/explorer/types";

export const TOKEN_BALANCE_BATCH_SIZE = 10;

/**
 * Get all assets linked to the user (native, tokens, ...)
 * @param currency - The currency we must get the balances of
 * @param address - The user's address
 * @returns Promise<Balance[]> - Array of balances for all assets (first element will always be the native asset)
 */
export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const nodeApi = getNodeApi(currency);
  const explorerApi = getExplorerApi(currency);

  const [nativeBalance, tokensBalances] = await Promise.all([
    getNativeBalance(currency, address, nodeApi),
    getTokenBalances(currency, address, nodeApi, explorerApi),
  ]);

  return [nativeBalance].concat(tokensBalances);
}

async function getNativeBalance(
  currency: CryptoCurrency,
  address: string,
  nodeApi: NodeApi,
): Promise<Balance> {
  // Get native balance for the first element array
  const nativeBalance = await nodeApi.getCoinBalance(currency, address);

  return {
    asset: { type: "native" },
    value: BigInt(nativeBalance.toFixed(0)),
  };
}

async function getTokenBalances(
  currency: CryptoCurrency,
  address: string,
  nodeApi: NodeApi,
  explorerApi: ExplorerApi,
): Promise<Balance[]> {
  // Get user's token operations to get all his contract address for the next balance elements
  const { lastTokenOperations } = await explorerApi.getLastOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    0,
  );

  // Collect unique contract addresses and their types
  type Entry = { contract: string; asset: AssetInfo };
  const entries = new Set<Entry>();
  for (const operation of lastTokenOperations) {
    if (operation.contract) {
      let assetType = "erc20";
      switch (operation.standard) {
        case "ERC721":
          assetType = "erc721";
          break;
        case "ERC1155":
          assetType = "erc1155";
          break;
      }
      entries.add({
        contract: operation.contract,
        asset: { type: assetType, assetReference: operation.contract, assetOwner: address },
      });
    }
  }

  // Fetch balances in parallel (by batches)
  const balances: Balance[] = [];
  const entriesArray = Array.from(entries);
  for (let i = 0; i < entriesArray.length; i += TOKEN_BALANCE_BATCH_SIZE) {
    const chunk = entriesArray.slice(i, i + TOKEN_BALANCE_BATCH_SIZE);
    const chunkBalances = await Promise.all(
      chunk.map(async entry => {
        const balance = await nodeApi.getTokenBalance(currency, address, entry.contract);
        return { asset: entry.asset, value: BigInt(balance.toFixed(0)) };
      }),
    );
    balances.push(...chunkBalances);
  }

  return balances;
}

export default getBalance;
