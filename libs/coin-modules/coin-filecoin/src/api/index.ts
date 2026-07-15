import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  Page,
  Reward,
  Stake,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { type FilecoinCoinConfig } from "../config";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

export function createApi(config: FilecoinCoinConfig): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" as const } }));

  return {
    broadcast,
    combine,
    craftTransaction,
    estimateFees,
    lastBlock,
    listOperations,
    validateIntent,
    getNextSequence,
    validateAddress,
    craftTransactionData,

    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),

    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },

    getBlock(_height: number): Promise<Block> {
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
  };
}
