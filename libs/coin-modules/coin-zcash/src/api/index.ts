import { BigNumber } from "bignumber.js";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { ZcashConfigInfo } from "../config";
import { setCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction as craftTransactionPlan,
  estimateFees as estimateFeesForPlan,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
  validateAddress,
} from "../logic";

export type ZcashApiConfig = { info: ZcashConfigInfo };

/**
 * Assembles the `CoinModuleApi` surface from `logic/` (boilerplate `api/index.ts`
 * shape). coin-zcash's crafting fundamentally needs pre-resolved transparent
 * UTXOs / Orchard notes (see logic/transaction/craftTransaction.ts's `CraftPlan`):
 * a bare `TransactionIntent` (sender/recipient/amount) has no such context, so
 * `craftTransaction`/`estimateFees` here operate on a zero-input placeholder
 * plan -- they exercise the wiring to `logic/`, but the real, fully-resolved
 * crafting path is the `AccountBridge` (see `bridge/signOperation.ts`), which
 * is what Ledger Live actually uses to sign and broadcast.
 */
export function createApi(config: ZcashApiConfig): CoinModuleApi {
  setCoinConfig(() => config);

  return {
    broadcast: (tx: string) => broadcast(tx),
    async call() {
      throw new Error("call is not supported");
    },
    combine: (tx: string, signature: string) =>
      combine({ pczt: tx, orchardSignatures: [signature], transparentSignatures: [] }).then(
        result => result.txHex,
      ),
    craftTransaction: craft,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options) as Promise<Balance[]>,
    lastBlock,
    listOperations,
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: getNextValidSequence,
    validateAddress,
    craftTransactionData,
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const result = await craftTransactionPlan({
    ufvk: "",
    accountIndex: 0,
    feeZat: "0",
    spends: [],
    transparentInputs: [],
    outputs: [
      { address: transactionIntent.recipient, valueZat: transactionIntent.amount.toString() },
    ],
  });
  return { transaction: result.pcztHex, details: { feeZat: result.feeZat } };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const fee = estimateFeesForPlan({
    transferType: "transparent",
    transparentInputCount: 0,
    orchardSpendCount: 0,
    hasChange: false,
  });
  return {
    value: BigInt((fee as BigNumber).toFixed(0)),
    parameters: { recipient: transactionIntent.recipient },
  };
}
