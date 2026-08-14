import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  AccountReadiness,
  Operation as LiveOperation,
  StakingRedelegation,
  StakingResources,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import {
  fetchRedelegations,
  buildRedelegationsFromOps,
} from "@ledgerhq/coin-evm/staking/redelegations";
import { STAKING_CONTRACTS, isSeiAccountUnassociated } from "@ledgerhq/coin-evm/staking/index";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { getNextSequence } from "@ledgerhq/coin-evm/logic/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCurrencyConfiguration } from "../../../config";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  const result =
    "assetReference" in asset && typeof asset.assetReference === "string"
      ? await getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id)
      : undefined;
  return result;
}

export function getAssetFromToken(
  currency: CryptoCurrency,
  token: TokenCurrency,
  owner: string,
): AssetInfo {
  if (token.parentCurrencyId !== currency.id) {
    throw new Error(`'${token.id}' is not a valid token for '${currency.id}'`);
  }

  return {
    type: token.tokenType,
    assetReference: eip55.encode(token.contractAddress),
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  if (typeof transaction.mode !== "string") {
    throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }

  if (["send-legacy", "send-eip1559"].includes(transaction.mode)) {
    return transaction.mode;
  }

  if (
    ["delegate", "redelegate", "undelegate", "claimReward", "compoundReward", "withdraw"].includes(
      transaction.mode,
    )
  ) {
    return transaction.type === 2 ? "staking-eip1559" : "staking-legacy";
  }

  if (transaction.mode === "send") {
    return transaction.type === 2 ? "send-eip1559" : "send-legacy";
  }

  throw new Error(`Unsupported transaction mode: '${transaction.mode}'`);
}

function getBalanceOptions(currency: CryptoCurrency): BalanceOptions {
  return {
    includeAssets: async (assetInfo: AssetInfo) => {
      if (assetInfo.type === "native") {
        return true;
      }

      const tokenCurrency = await getTokenFromAsset(currency, assetInfo);
      return tokenCurrency !== undefined;
    },
  };
}

async function enrichStakingResources(
  currency: CryptoCurrency,
  address: string,
  operations: LiveOperation[],
  stakingResources: StakingResources,
): Promise<StakingResources> {
  // Fetch redelegations from the Cosmos REST API (may return empty for
  // EVM-precompile-originated redelegations on chains like Sei).
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  const apiRedelegations = await fetchRedelegations(config, currency.id, address).catch(() => []);

  // Reconstruct active redelegations from the REDELEGATE operation history by
  // decoding the ABI-encoded calldata fetched directly from the RPC node.
  const opsRedelegations = await buildRedelegationsFromOps(config, currency.id, operations);

  // Merge both sources, deduplicating by (src, dst) validator pair.
  const key = (r: StakingRedelegation) => `${r.validatorSrcAddress}|${r.validatorDstAddress}`;
  const existing = new Set(apiRedelegations.map(key));
  const merged: StakingRedelegation[] = [
    ...apiRedelegations,
    ...opsRedelegations.filter(r => !existing.has(key(r))),
  ];

  return { ...stakingResources, redelegations: merged };
}

async function getOperationStatus(
  currency: CryptoCurrency,
  op: LiveOperation,
): Promise<LiveOperation | null> {
  try {
    const nodeApi = getNodeApi(getCurrencyConfiguration<EvmConfigInfo>(currency.id), currency.id);
    const { blockHeight, blockHash, nonce, gasPrice, gasUsed, value } =
      await nodeApi.getTransaction(currency.id, op.hash);

    if (!blockHeight) {
      throw new Error("getOperationStatus: Transaction has no block");
    }

    const { timestamp } = await nodeApi.getBlockByHeight(currency.id, blockHeight);
    const date = new Date(timestamp);
    const fee = new BigNumber(gasPrice).multipliedBy(gasUsed);

    return {
      ...op,
      transactionSequenceNumber: new BigNumber(nonce),
      blockHash,
      blockHeight,
      date,
      fee,
      value: new BigNumber(value.toString()).plus(fee),
      subOperations: op.subOperations?.map(subOp => ({
        ...subOp,
        transactionSequenceNumber: new BigNumber(nonce),
        blockHash,
        blockHeight,
        date,
      })),
    } as LiveOperation;
  } catch {
    return null;
  }
}

export async function refreshOperations(
  currency: CryptoCurrency,
  operations: LiveOperation[],
): Promise<LiveOperation[]> {
  const refreshedOperationsOrNull = await Promise.all(
    operations.map(op => getOperationStatus(currency, op)),
  );

  return refreshedOperationsOrNull.filter((op): op is LiveOperation => !!op);
}

/**
 * A Sei account can only transact (swap included) once its EVM (0x) address is
 * associated on-chain with its Cosmos (sei1) address.
 */
export async function getAccountReadiness(
  currency: CryptoCurrency,
  address: string,
): Promise<AccountReadiness> {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  const unassociated = await isSeiAccountUnassociated(config, currency.id, address);
  return unassociated ? { ready: false, reason: "activationRequired" } : { ready: true };
}

export async function validateTransaction(
  currency: CryptoCurrency,
  { signature }: { signature: string },
): Promise<{ error: Error | undefined }> {
  const nodeApi = getNodeApi(getCurrencyConfiguration<EvmConfigInfo>(currency.id), currency.id);
  const transaction = ethers.Transaction.from(signature);

  if (transaction.hash) {
    try {
      const { hash, blockHeight = null } = await nodeApi.getTransaction(
        currency.id,
        transaction.hash,
      );
      if (blockHeight) {
        return { error: new InvalidTransactionError("transaction is already mined") };
      }
      if (hash) {
        return { error: new InvalidTransactionError("transaction is already known") };
      }
    } catch {
      // eslint-disable-next-line no-empty
    }
  }

  if (transaction.from) {
    const currentNonce = await getNextSequence(
      buildContext(currency.id),
      currency.id,
      transaction.from,
    );
    if (typeof transaction.nonce === "number") {
      const txNonce = BigInt(transaction.nonce);
      if (txNonce < currentNonce) {
        return {
          error: new InvalidTransactionError("nonce is too low"),
        };
      }
    }
  }

  return { error: undefined };
}

export default function evmBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) =>
      getAssetFromToken(currency, token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    balanceOptions: getBalanceOptions(currency),
    enrichStakingResources: (c, addr, ops, sr) => enrichStakingResources(c, addr, ops, sr),
    validateTransaction: (signature: string) => validateTransaction(currency, { signature }),
    ...(STAKING_CONTRACTS[currency.id] ? { stakingSupported: true } : {}),
    // Only Sei has an activation concept; elsewhere readiness stays undefined (= ready).
    ...(currency.id === "sei_evm" ? { getAccountReadiness } : {}),
    // Config comes from `getCurrencyConfiguration` (the live-common config source), available at
    // bridge-assembly time. Only expose refreshOperations
    // for explorer-less chains (e.g. core) — explorer-backed chains rely on the explorer's results.
    // Extra-safe: wrap throwing method in try / catch block
    // TODO: rely on `getTransactions` once https://ledgerhq.atlassian.net/browse/BACK-11373 is done
    ...(() => {
      try {
        return getCurrencyConfiguration<EvmConfigInfo>(currency.id).explorer?.type === "none"
          ? {
              refreshOperations: (operations: LiveOperation[]) =>
                refreshOperations(currency, operations),
            }
          : {};
      } catch {
        return {};
      }
    })(),
  };
}
