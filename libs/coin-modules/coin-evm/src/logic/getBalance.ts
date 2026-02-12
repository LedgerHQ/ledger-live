import type { Balance, AssetInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { getExplorerApi } from "../network/explorer";
import { ExplorerApi } from "../network/explorer/types";
import { getNodeApi } from "../network/node";
import { NodeApi } from "../network/node/types";
import { getStakes } from "./getStakes";

export const TOKEN_BALANCE_BATCH_SIZE = 8;

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
  const balances: Balance[] = [];

  // Execute staking and token operations in parallel for better performance
  const [stakingResult, tokenOperationsResult] = await Promise.allSettled([
    getStakes(currency, address),
    explorerApi.getLastOperations(currency, address, `js:2:${currency.id}:${address}:`, 0),
  ]);

  // Add staking positions to balances (with error handling)
  if (stakingResult.status === "fulfilled") {
    stakingResult.value.items.forEach(stake => {
      balances.push({
        value: stake.amount,
        asset: stake.asset,
        stake,
      });
    });
  }

  // Process token operations (with error handling)
  const lastTokenOperations =
    tokenOperationsResult.status === "fulfilled"
      ? tokenOperationsResult.value.lastTokenOperations
      : [];

  // Collect unique contract addresses and their types
  const contracts = new Set<string>();
  const assets = new Map<string, AssetInfo>();
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
      contracts.add(operation.contract);
      assets.set(operation.contract, {
        type: assetType,
        assetReference: operation.contract,
        assetOwner: address,
      });
    }
  }

  // Fetch balances in parallel (by batches)
  const contractsArray = Array.from(contracts);
  for (let i = 0; i < contractsArray.length; i += TOKEN_BALANCE_BATCH_SIZE) {
    const chunk = contractsArray.slice(i, i + TOKEN_BALANCE_BATCH_SIZE);
    const chunkBalancesPromises = await Promise.allSettled(
      chunk.map(async contract => {
        const asset = assets.get(contract);
        if (asset === undefined) throw new Error(`No asset defined for contract ${contract}`);
        const balance = await nodeApi.getTokenBalance(currency, address, contract);
        return { asset, value: BigInt(balance.toFixed(0)) };
      }),
    );
    const chunkBalances = chunkBalancesPromises
      .filter((p): p is PromiseFulfilledResult<Balance> => p.status === "fulfilled")
      .map(balance => balance.value);
    balances.push(...chunkBalances);
  }

  return balances;
}

export default getBalance;
