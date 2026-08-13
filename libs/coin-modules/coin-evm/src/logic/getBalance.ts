import type {
  Balance,
  AssetInfo,
  BalanceOptions,
  MemoNotSupported,
  Operation,
} from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";

import { EvmConfigInfo, type EvmContext } from "../config";
import { getExplorerApi } from "../network/explorer";
import { ExplorerApi } from "../network/explorer/types";
import { getNodeApi } from "../network/node";
import { NodeApi } from "../network/node/types";
import { getStakes } from "./getStakes";

export const TOKEN_BALANCE_BATCH_SIZE = 8;

/**
 * Get all assets linked to the user (native, tokens, ...)
 * @param context - The coin-module context (config + logger)
 * @param currency - The currency we must get the balances of
 * @param address - The user's address
 * @returns Promise<Balance[]> - Array of balances for all assets (first element will always be the native asset)
 */
export async function getBalance(
  context: EvmContext,
  currency: CryptoCurrency,
  address: string,
  options?: BalanceOptions,
): Promise<Balance[]> {
  const config = await context.config(currency.id);
  const nodeApi = getNodeApi(config, currency);
  const explorerApi = getExplorerApi(config, currency);

  const [nativeBalance, tokensBalances] = await Promise.all([
    getNativeBalance(currency, address, nodeApi),
    getTokenBalances(context, currency, address, nodeApi, explorerApi, config, options),
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
  context: EvmContext,
  currency: CryptoCurrency,
  address: string,
  nodeApi: NodeApi,
  explorerApi: ExplorerApi,
  config: EvmConfigInfo,
  options?: BalanceOptions,
): Promise<Balance[]> {
  const balances: Balance[] = [];

  // Execute staking and token operations in parallel for better performance
  const [stakingResult, tokenOperationsResult] = await Promise.allSettled([
    getStakes(context, currency, address),
    explorerApi.getOperations(config, currency, address, 0),
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
  const { nativeContracts = [] } = config;
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
  lastTokenOperations: Array<Operation<MemoNotSupported>>,
  address: string,
  nativeContractsSet: Set<string>,
  options: BalanceOptions | undefined,
): Promise<{ contracts: Set<string>; assets: Map<string, AssetInfo> }> {
  const contracts = new Set<string>();
  const assets = new Map<string, AssetInfo>();

  for (const operation of lastTokenOperations) {
    if (!("assetReference" in operation.asset)) continue;
    const contract = operation.asset.assetReference;
    if (!contract) continue;
    if (nativeContractsSet.has(contract.toLowerCase())) continue;

    const assetInfo: AssetInfo = {
      type: operation.asset.type,
      assetReference: contract,
      assetOwner: address,
    };

    const includeAssets = !options?.includeAssets || (await options.includeAssets(assetInfo));
    if (includeAssets) {
      contracts.add(contract);
      assets.set(contract, assetInfo);
    }
  }

  return { contracts, assets };
}

export default getBalance;
