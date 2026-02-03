import type {
  Api,
  Block,
  BlockInfo,
  Cursor,
  Page,
  Stake,
  Reward,
  Validator,
  CraftedTransaction,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
  Operation,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { encodeAccountId } from "@ledgerhq/coin-framework/lib/account/accountId";
import coinConfig, { type AleoConfig } from "../config";
import { listOperations } from "../logic";

export function createApi(config: AleoConfig, currencyId: string): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (_signature: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine: (_transaction: string, _signature: string, _publicKey: string | undefined): string => {
      throw new Error("combine is not supported");
    },
    craftTransaction: async (
      _account: unknown,
      _transaction: unknown,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (): Promise<FeeEstimation> => {
      throw new Error("estimateFees is not supported");
    },
    getBalance: (_address: string): Promise<Balance[]> => {
      throw new Error("getBalance is not supported");
    },
    lastBlock: async (): Promise<BlockInfo> => {
      throw new Error("lastBlock is not supported");
    },
    listOperations: async (address, pagination) => {
      const ledgerAccountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: currency.id,
        xpubOrAddress: address,
        derivationMode: "",
      });

      const { operations, nextCursor } = await listOperations({
        currency,
        address,
        ledgerAccountId,
        pagination,
        fetchAllPages: false,
      });

      const alpacaOperations = operations.map(
        operation =>
          ({
            id: operation.id,
            type: operation.type,
            senders: operation.senders,
            recipients: operation.recipients,
            value: BigInt(operation.value.toFixed(0)),
            asset: { type: "native" },
            details: {
              ...operation.extra,
              ledgerOpType: operation.type,
            },
            tx: {
              hash: operation.hash,
              fees: BigInt(operation.fee.toFixed(0)),
              date: operation.date,
              block: {
                hash: operation.blockHash ?? "",
                height: operation.blockHeight ?? 0,
                time: operation.date,
              },
              failed: operation.hasFailed ?? false,
            },
          }) satisfies Operation,
      );

      return [alpacaOperations, nextCursor ?? ""];
    },
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
    getSequence: async (_address: string) => {
      throw new Error("getSequence is not supported");
    },
  };
}
