import {
  AlpacaApi,
  Block,
  BlockInfo,
  Cursor,
  Stake,
  Reward,
  Page,
  Validator,
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
import type { Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { AptosConfig as AptosConfigApi } from "../config";
import coinConfig from "../config";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { getBalances } from "../logic/getBalances";
import { AptosAPI } from "../network";

export function createApi(config: AptosConfigApi): AlpacaApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  const client = new AptosAPI(config.aptosSettings);

  return {
    broadcast: (tx: string) => client.broadcast(tx),
    combine: (tx, signature, pubkey): string => combine(tx, signature, pubkey),
    craftTransaction: (transactionIntent, _customFees): Promise<CraftedTransaction> =>
      craftTransaction(client, transactionIntent),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (transactionIntent: TransactionIntent) => client.estimateFees(transactionIntent),
    getBalance: (address): Promise<Balance[]> => getBalances(client, address),
    lastBlock: () => client.getLastBlock(),
    listOperations: (address: string, { minHeight }) => client.listOperations(address, minHeight),
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
  };
}
