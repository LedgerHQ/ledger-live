import {
  type Balance,
  Block,
  BlockInfo,
  Cursor,
  Page,
  IncorrectTypeError,
  type Operation,
  type Pagination,
  Reward,
  Stake,
} from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
  rawEncode,
} from "../logic";
import api from "../network/tzkt";
import type { TezosApi, TezosFeeEstimation } from "./types";
import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { TezosOperationMode } from "../types";

export function createApi(config: TezosConfig): TezosApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance: balance,
    lastBlock,
    listOperations: operations,
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
  };
}

function isTezosTransactionType(type: string): type is "send" | "delegate" | "undelegate" {
  return ["send", "delegate", "undelegate"].includes(type);
}

async function balance(address: string): Promise<Balance[]> {
  const value = await getBalance(address);
  return [
    {
      value,
      asset: { type: "native" },
    },
  ];
}

async function craft(
  transactionIntent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<string> {
  if (!isTezosTransactionType(transactionIntent.type)) {
    throw new IncorrectTypeError(transactionIntent.type);
  }

  // note that an estimation is always necessary to get gasLimit and storageLimit, if even using custom fees
  const fee = await estimate(transactionIntent).then(fees => ({
    fees: (customFees?.value ?? fees.value).toString(),
    gasLimit: fees.parameters?.gasLimit?.toString(),
    storageLimit: fees.parameters?.storageLimit?.toString(),
  }));

  const { contents } = await craftTransaction(
    { address: transactionIntent.sender },
    {
      type: transactionIntent.type,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee,
    },
  );
  return rawEncode(contents);
}

async function estimate(transactionIntent: TransactionIntent): Promise<TezosFeeEstimation> {
  const senderAccountInfo = await api.getAccountByAddress(transactionIntent.sender);
  if (senderAccountInfo.type !== "user") throw new Error("unexpected account type");

  const {
    estimatedFees: value,
    gasLimit,
    storageLimit,
    taquitoError,
  } = await estimateFees({
    account: {
      address: transactionIntent.sender,
      revealed: senderAccountInfo.revealed,
      balance: BigInt(senderAccountInfo.balance),
      // NOTE: previously we checked for .sender.xpub
      xpub: transactionIntent.senderPublicKey ?? senderAccountInfo.publicKey,
    },
    transaction: {
      mode: transactionIntent.type as TezosOperationMode,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
    },
  });

  if (taquitoError !== undefined) {
    throw new Error(`Fees estimation failed: ${taquitoError}`);
  }

  return {
    value,
    parameters: {
      gasLimit,
      storageLimit,
    },
  };
}

async function operations(
  address: string,
  pagination: Pagination = { minHeight: 0, order: "asc" },
): Promise<[Operation[], string]> {
  const [operations, newNextCursor] = await listOperations(address, {
    limit: 200,
    token: pagination.lastPagingToken,
    sort: pagination.order === "asc" ? "Ascending" : "Descending",
    minHeight: pagination.minHeight,
  });
  return [operations, newNextCursor || ""];
}
