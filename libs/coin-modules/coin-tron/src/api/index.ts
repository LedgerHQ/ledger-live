import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import coinConfig, { type TronConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  getBlock,
  getBlockInfo,
  getValidators,
  lastBlock,
  listOperations as listOperationsLogic,
  validateAddress,
  validateIntent,
} from "../logic";
import { defaultFetchParams, getBlock as getBlockNetwork } from "../network";
import type { TronMemo, TronTxData } from "../types";

const MAX_TRONGRID_LIMIT = 200;

export function createApi(config: TronConfig): CoinModuleApi<TronMemo, TronTxData> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    // Tron contract reads (triggerconstantcontract) are intentionally not supported yet.
    async call() {
      throw new Error("call is not supported");
    },
    combine,
    craftTransaction,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees,
    getAccountInfo,
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    lastBlock,
    listOperations,
    getBlock,
    getBlockInfo,
    // Not implemented yet, which `supportedFeatures` contradicts — every other staking coin module
    // implements this, and the wallet is not the only consumer. Left for its own change because the
    // mapping needs deciding, not just writing: Tron stakes at two overlapping layers (TRX frozen for
    // account-wide Tron Power, that power then voted to super representatives), so emitting both
    // double-counts the same TRX for a caller summing `amount`. The agreed shape is one Stake per vote
    // plus the unvoted remainder plus one per unfreezing entry, with `tronResources.unwithdrawnReward`
    // split pro-rata by vote — exact in total, approximate per validator, since per-SR brokerage rates
    // are not fetched.
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    // Unsupported chain-wide, as it is for cosmos, cardano and tezos: `Reward` describes a distribution
    // event with a `receivedAt` date, and Trongrid exposes only the *pending* accrued total
    // (`tronResources.unwithdrawnReward`). Withdrawals appear in `listOperations`.
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators,
    validateIntent,
    // Tron uses (timestamp + ref_block_hash) for replay protection rather than
    // a per-account nonce, so getNextSequence has no meaningful value here.
    getNextSequence: async (_address: string) => 0n,
    validateAddress,
    craftTransactionData,
  };
}

/**
 * Per ADR-047 the Tron-specific transaction fields live in {@link TronTxData} on the intent, so by
 * the time an intent reaches this API the payload is already built — by
 * `BridgeApi.buildIntentData`, which is the only layer that knows the wallet's Tron transaction
 * shape. This member exists to satisfy `CoinModuleApi` and to keep a caller that builds an intent
 * by hand (the coin-tester, a script) from losing data it already supplied.
 */
function craftTransactionData(intent: TransactionIntent<TronMemo, TronTxData>): TronTxData {
  return intent.data ?? { type: "tron" };
}

async function listOperations(
  address: string,
  { minHeight, order, cursor, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > MAX_TRONGRID_LIMIT) {
    throw new Error(`limit must be <= ${MAX_TRONGRID_LIMIT} for Tron (TronGrid API restriction)`);
  }
  const effectiveLimit = limit ?? MAX_TRONGRID_LIMIT;
  const effectiveOrder = order ?? "asc";

  let minTimestamp = defaultFetchParams.minTimestamp;
  if (minHeight > 0) {
    // getBlock rejects when minHeight points just past the chain tip (block not yet
    // produced); fall back to the default bound instead of failing the whole listing.
    const block = await getBlockNetwork(minHeight).catch(() => null);
    minTimestamp = block?.time?.getTime() ?? defaultFetchParams.minTimestamp;
  }

  return listOperationsLogic(address, {
    limit: effectiveLimit,
    minTimestamp,
    order: effectiveOrder,
    cursor,
  });
}
