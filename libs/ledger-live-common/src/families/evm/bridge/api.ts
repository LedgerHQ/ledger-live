import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi, ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  AccountReadiness,
  Operation as LiveOperation,
  StakingRedelegation,
  StakingRedelegationRaw,
  StakingResources,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  ChainReadUnsupportedError,
  InvalidTransactionError,
} from "@ledgerhq/ledger-wallet-framework/errors";
import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { FunctionFragment, Interface, Transaction as EthersTransaction } from "ethers";
import { buildRedelegationsFromOps } from "@ledgerhq/coin-evm/staking";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCurrencyConfiguration } from "../../../config";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getStakingContract } from "../staking/logic";
import { legacyChainReads } from "./legacyChainReads";

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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const redelegationKey = (r: StakingRedelegation) =>
  `${r.validatorSrcAddress}|${r.validatorDstAddress}`;

/** The redelegations the account metadata reports (JSON form); none when the read fails. */
async function reportedRedelegations(
  chain: ChainReads,
  address: string,
): Promise<StakingRedelegation[]> {
  try {
    const { redelegations } = await chain.getAccountInfo(address);
    if (!Array.isArray(redelegations)) return [];
    return (redelegations as StakingRedelegationRaw[]).map(
      ({ validatorSrcAddress, validatorDstAddress, amount, completionDate }) => ({
        validatorSrcAddress,
        validatorDstAddress,
        amount: new BigNumber(amount),
        completionDate: new Date(completionDate),
      }),
    );
  } catch {
    return [];
  }
}

/**
 * The REDELEGATE operations coin-evm decodes (still unbonding, not failed), each carrying its
 * calldata: the cached `extra.contractPayload`, or the transaction's input data the chain reads
 * answer. One whose calldata cannot be read is left out, so coin-evm never reads it itself.
 */
async function redelegateOperationsWithPayload(
  currencyId: string,
  operations: LiveOperation[],
  chain: ChainReads,
): Promise<LiveOperation[]> {
  const staking = getStakingContract(currencyId);
  if (!staking?.functions.redelegate) return [];
  const unbondingMs = (staking.unbondingPeriodDays ?? 21) * MS_PER_DAY;
  const now = Date.now();
  const eligible = operations.filter(
    op => op.type === "REDELEGATE" && !op.hasFailed && op.date.getTime() + unbondingMs > now,
  );
  const withPayload = await Promise.all(
    eligible.map(async op => {
      const extra = (op.extra ?? {}) as Record<string, unknown>;
      if (typeof extra.contractPayload === "string") return op;
      const data = await chain
        .getTransactionInfo(op.hash)
        .then(info => info?.data)
        .catch(() => undefined);
      return data ? { ...op, extra: { ...extra, contractPayload: data } } : null;
    }),
  );
  return withPayload.filter((op): op is LiveOperation => op !== null);
}

/**
 * The redelegations in progress: those the account metadata reports (the Cosmos staking module of
 * Sei), and those decoded from the account's REDELEGATE operations (precompile-originated ones the
 * module does not list), deduplicated by validator pair.
 */
export async function enrichStakingResources(
  currency: CryptoCurrency,
  address: string,
  operations: LiveOperation[],
  stakingResources: StakingResources,
  chain: ChainReads,
): Promise<StakingResources> {
  const evmCtx = buildContext<EvmConfigInfo>(currency.id);
  const config = await evmCtx.config();
  const [apiRedelegations, redelegateOperations] = await Promise.all([
    reportedRedelegations(chain, address),
    redelegateOperationsWithPayload(currency.id, operations, chain),
  ]);
  const opsRedelegations = await buildRedelegationsFromOps(
    config,
    redelegateOperations,
    evmCtx.logger,
  );

  const existing = new Set(apiRedelegations.map(redelegationKey));
  const merged: StakingRedelegation[] = [
    ...apiRedelegations,
    ...opsRedelegations.filter(r => !existing.has(redelegationKey(r))),
  ];

  return { ...stakingResources, redelegations: merged };
}

/** A pending operation as mined, from what the chain knows of its transaction; null otherwise. */
async function refreshedOperation(
  op: LiveOperation,
  chain: ChainReads,
): Promise<LiveOperation | null> {
  const info = await chain.getTransactionInfo(op.hash).catch(() => undefined);
  if (!info?.block) return null;

  const { height: blockHeight, hash: blockHash, time: date } = info.block;
  const transactionSequenceNumber =
    info.sequence === undefined
      ? op.transactionSequenceNumber
      : new BigNumber(info.sequence.toString());
  const fee = new BigNumber((info.fee ?? 0n).toString());
  return {
    ...op,
    transactionSequenceNumber,
    blockHash,
    blockHeight,
    date,
    fee,
    value: new BigNumber((info.value ?? 0n).toString()).plus(fee),
    subOperations: op.subOperations?.map(subOp => ({
      ...subOp,
      transactionSequenceNumber,
      blockHash,
      blockHeight,
      date,
    })),
  };
}

/**
 * The pending operations the chain reads find mined, refreshed: for chains without an explorer,
 * whose listing does not report them. Any other operation (pending, unknown, unreadable) is left out.
 */
export async function refreshOperations(
  operations: LiveOperation[],
  chain: ChainReads,
): Promise<LiveOperation[]> {
  const refreshed = await Promise.all(operations.map(op => refreshedOperation(op, chain)));
  return refreshed.filter((op): op is LiveOperation => op !== null);
}

/**
 * A Sei account can only transact (swap included) once its EVM (0x) address is
 * associated on-chain with its Cosmos (sei1) address: the chain's address precompile returns the
 * linked Cosmos address, and reverts while there is none. Any failure of that call (the revert, an
 * RPC error) reads as unassociated, so the warning is shown; without an external node or a
 * precompile there is nothing to check. A path that cannot make the call keeps the readiness.
 */
export async function getAccountReadiness(
  currency: CryptoCurrency,
  address: string,
  chain: ChainReads,
): Promise<AccountReadiness> {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  if (config.node?.type !== "external") return { ready: true };
  const precompile = getStakingContract(currency.id)?.apiConfig?.precompileAddress;
  if (!precompile) return { ready: true };

  const { name } = FunctionFragment.from(precompile.abi);
  const contract = new Interface([precompile.abi]);
  let associated: boolean;
  try {
    const result = await chain.call({
      to: precompile.address,
      data: contract.encodeFunctionData(name, [address]),
    });
    const [cosmosAddress] = contract.decodeFunctionResult(name, result as string);
    associated = typeof cosmosAddress === "string" && cosmosAddress.length > 0;
  } catch (error) {
    if (error instanceof ChainReadUnsupportedError) throw error;
    associated = false;
  }
  return associated ? { ready: true } : { ready: false, reason: "activationRequired" };
}

/**
 * Checks a signed transaction before broadcast: not already mined nor known by the chain (a failed
 * lookup checks nothing), and its nonce not below the account's next one.
 */
export async function validateTransaction(
  signature: string,
  chain: ChainReads,
): Promise<{ error: Error | undefined }> {
  const transaction = EthersTransaction.from(signature);

  if (transaction.hash) {
    const info = await chain.getTransactionInfo(transaction.hash).catch(() => undefined);
    if (info?.block) {
      return { error: new InvalidTransactionError("transaction is already mined") };
    }
    if (info) {
      return { error: new InvalidTransactionError("transaction is already known") };
    }
  }

  if (transaction.from) {
    const currentNonce = await nextSequence(chain, transaction.from);
    if (
      typeof transaction.nonce === "number" &&
      currentNonce !== undefined &&
      BigInt(transaction.nonce) < currentNonce
    ) {
      return { error: new InvalidTransactionError("nonce is too low") };
    }
  }

  return { error: undefined };
}

/** The next sequence of `address`; undefined when the path cannot tell it (the node checks then). */
async function nextSequence(chain: ChainReads, address: string): Promise<bigint | undefined> {
  try {
    return await chain.getNextSequence(address);
  } catch (error) {
    if (error instanceof ChainReadUnsupportedError) return undefined;
    throw error;
  }
}

export default function evmBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) =>
      getAssetFromToken(currency, token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    balanceOptions: getBalanceOptions(currency),
    legacyChainReads,
    enrichStakingResources,
    validateTransaction,
    ...(getStakingContract(currency.id) ? { stakingSupported: true } : {}),
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
          ? { refreshOperations }
          : {};
      } catch {
        return {};
      }
    })(),
  };
}
