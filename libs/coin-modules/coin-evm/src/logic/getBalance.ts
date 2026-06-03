import type { Balance, AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { getCoinConfig } from "../config";
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
export async function getBalance(
  currency: CryptoCurrency,
  address: string,
  options?: BalanceOptions,
): Promise<Balance[]> {
  const nodeApi = getNodeApi(currency);
  const explorerApi = getExplorerApi(currency);

  const [nativeBalance, tokensBalances] = await Promise.all([
    getNativeBalance(currency, address, nodeApi),
    getTokenBalances(currency, address, nodeApi, explorerApi, options),
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
  options?: BalanceOptions,
): Promise<Balance[]> {
  const balances: Balance[] = [];

  // Execute staking and token operations in parallel for better performance
  const [stakingResult, tokenOperationsResult] = await Promise.allSettled([
    getStakes(currency, address),
    explorerApi.getOperations(currency, address, `js:2:${currency.id}:${address}:`, 0),
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

  // Contracts whose ERC20 balance mirrors the native balance — skip them here to avoid
  // counting the same value twice (the native balance is already returned upstream).
  const { nativeContracts = [] } = getCoinConfig(currency.id).info;
  const nativeContractsSet = new Set(nativeContracts.map(c => c.toLowerCase()));

  const { contracts, assets } = await collectTokenAssets(
    lastTokenOperations,
    address,
    nativeContractsSet,
    options,
  );

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

/**
 * Walk token-transfer operations and build the set of contracts whose balance we need,
 * along with their AssetInfo metadata. Contracts in `nativeContractsSet` are skipped
 * (their balance is the native balance, returned upstream).
 */
async function collectTokenAssets(
  lastTokenOperations: { contract?: string; standard?: string }[],
  address: string,
  nativeContractsSet: Set<string>,
  options: BalanceOptions | undefined,
): Promise<{ contracts: Set<string>; assets: Map<string, AssetInfo> }> {
  const contracts = new Set<string>();
  const assets = new Map<string, AssetInfo>();

  for (const operation of lastTokenOperations) {
    if (!operation.contract) continue;
    if (nativeContractsSet.has(operation.contract.toLowerCase())) continue;

    const assetInfo: AssetInfo = {
      type: assetTypeFromStandard(operation.standard),
      assetReference: operation.contract,
      assetOwner: address,
    };

    const includeAssets = !options?.includeAssets || (await options.includeAssets(assetInfo));
    if (includeAssets) {
      contracts.add(operation.contract);
      assets.set(operation.contract, assetInfo);
    }
  }

  return { contracts, assets };
}

function assetTypeFromStandard(standard: string | undefined): string {
  switch (standard) {
    case "ERC721":
      return "erc721";
    case "ERC1155":
      return "erc1155";
    default:
      return "erc20";
  }
}

export default getBalance;
