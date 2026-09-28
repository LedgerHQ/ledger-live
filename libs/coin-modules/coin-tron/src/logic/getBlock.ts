import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  getBlock as networkGetBlock,
  getBlockWithTransactions,
  getTransactionInfoByBlockNum,
} from "../network";
import { encode58Check } from "../network/format";
import { hasUnresolvedTokenReference, inferAssetInfo } from "../network/trongrid/trongrid-adapters";
import type { BlockTransactionAPI, TransactionInfoByBlockNumAPI } from "../network/types";
import { abiDecodeTrc20Transfer, decodeTrc20TransferLog } from "../network/utils";
import type { TrongridTxInfo, TrongridTxType } from "../types";

type BlockTxInfo = TrongridTxInfo;

export async function getBlockInfo(
  logger: Logger,
  config: TronCoinConfig,
  height: number,
): Promise<BlockInfo> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`Invalid block height: ${height}`);
  }

  const block = await networkGetBlock(logger, config, height);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}

export async function getBlock(
  logger: Logger,
  config: TronCoinConfig,
  height: number,
): Promise<Block> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`Invalid block height: ${height}`);
  }

  const [data, txInfos] = await Promise.all([
    getBlockWithTransactions(logger, config, height),
    getTransactionInfoByBlockNum(logger, config, height).catch(error => {
      logger("tron/getBlock", "Failed to fetch transaction info, falling back to ret fees", {
        height,
        error,
      });
      return [];
    }),
  ]);
  const header = data.block_header.raw_data;
  const blockTimestamp = header.timestamp ?? 0;

  const info: BlockInfo = {
    height: header.number ?? height,
    hash: data.blockID,
    time: blockTimestamp ? new Date(blockTimestamp) : new Date(0),
  };

  if (header.parentHash && info.height > 1) {
    info.parent = { height: info.height - 1, hash: header.parentHash };
  }

  const rawTxs = data.transactions ?? [];
  const txInfoById = buildTxInfoMap(txInfos);

  const transactions: BlockTransaction[] = rawTxs
    .map(tx => toBlockTransaction(logger, tx, blockTimestamp, info.height, txInfoById))
    .filter((tx): tx is BlockTransaction => tx !== null);

  return { info, transactions };
}

function buildTxInfoMap(
  txInfos: TransactionInfoByBlockNumAPI[],
): Map<string, TransactionInfoByBlockNumAPI> {
  return new Map(txInfos.map(tx => [tx.id, tx]));
}

function toBlockTransaction(
  logger: Logger,
  tx: BlockTransactionAPI,
  blockTimestamp: number,
  blockHeight: number,
  txInfoById: Map<string, TransactionInfoByBlockNumAPI>,
): BlockTransaction | null {
  const txDetail = txInfoById.get(tx.txID);
  const txInfo = formatBlockTransaction(logger, tx, blockTimestamp, blockHeight);
  if (!txInfo) return null;

  const fee = txDetail?.fee ?? tx.ret?.[0]?.fee ?? 0;

  // A contract deployment can mint TRC20 from its constructor. Those transfers are nowhere in
  // `raw_data` — `new_contract` holds no address and no call data — so they are read from the
  // receipt's events instead, which is the same evidence `listOperations` resolves them from.
  const mintOperations =
    txInfo.type === "CreateSmartContract" ? toConstructorMintOperations(txDetail) : [];

  return {
    hash: txInfo.txID,
    failed: txInfo.hasFailed,
    fees: BigInt(fee),
    feesPayer: txInfo.from,
    operations: mintOperations.length > 0 ? mintOperations : toBlockOperations(txInfo),
  };
}

function formatBlockTransaction(
  logger: Logger,
  tx: BlockTransactionAPI,
  blockTimestamp: number,
  blockHeight: number,
): BlockTxInfo | null {
  try {
    const contract = tx.raw_data.contract[0];
    if (!contract) return null;

    const type = contract.type as TrongridTxType;
    const params = contract.parameter.value;
    const ownerAddress = params.owner_address;
    if (!ownerAddress) return null;

    const from = encode58Check(ownerAddress);
    const contractRet = tx.ret?.[0]?.contractRet ?? "SUCCESS";
    const hasFailed = contractRet !== "SUCCESS";

    const isTrc20 = type === "TriggerSmartContract" && params.contract_address;
    const isTrc10 = type === "TransferAssetContract";
    const tokenType = isTrc10 ? "trc10" : isTrc20 ? "trc20" : undefined;

    let to: string | undefined;
    let value: BigNumber;

    if (isTrc20 && params.data) {
      const decoded = abiDecodeTrc20Transfer(params.data);
      if (decoded) {
        to = encode58Check(decoded.to);
        value = decoded.amount;
      } else {
        value = new BigNumber(0);
      }
    } else {
      to = params.to_address ? encode58Check(params.to_address) : undefined;
      value = params.amount ? new BigNumber(params.amount) : new BigNumber(0);
    }

    const tokenAddress =
      isTrc20 && params.contract_address ? encode58Check(params.contract_address) : undefined;

    const tokenId = isTrc10 ? decodeHexAssetName(params.asset_name) : tokenAddress;

    return {
      txID: tx.txID,
      date: new Date(blockTimestamp),
      type,
      tokenId,
      tokenType,
      tokenAddress,
      from,
      to,
      value,
      blockHeight,
      hasFailed,
    };
  } catch (error) {
    logger("tron/getBlock", "formatBlockTransaction error", {
      txId: tx.txID,
      error,
    });
    return null;
  }
}

/**
 * Every `Transfer` event a TRC20 deployment emits from its constructor, as the debit/credit pair a
 * plain transfer produces. All of them are reported, not just the first: a mint that
 * `listOperations` returns to one of the parties must show up here too, whatever else the same
 * deployment moved. A deployment emitting no decodable transfer yields nothing, and the
 * transaction stays a plain contract-creation operation.
 */
function toConstructorMintOperations(
  txDetail: TransactionInfoByBlockNumAPI | undefined,
): BlockOperation[] {
  return (txDetail?.log ?? [])
    .map(decodeTrc20TransferLog)
    .filter(transfer => transfer !== null)
    .flatMap(transfer => {
      if (transfer.amount.isZero() || !transfer.amount.isFinite()) return [];

      const asset = {
        type: "trc20",
        assetReference: encode58Check(transfer.contractAddress),
      };
      const from = encode58Check(transfer.from);
      const to = encode58Check(transfer.to);
      const amount = BigInt(transfer.amount.integerValue().toFixed(0));

      return [
        { type: "transfer" as const, address: from, peer: to, asset, amount: -amount },
        { type: "transfer" as const, address: to, peer: from, asset, amount },
      ];
    });
}

function toBlockOperations(txInfo: BlockTxInfo): BlockOperation[] {
  // An asset typed `trc10`/`trc20` with no reference names no token at all, so such a transfer is
  // reported as a plain contract operation rather than shipped with a half-populated asset.
  if (hasUnresolvedTokenReference(txInfo)) {
    return [{ type: "other", operationType: "NONE", contractType: txInfo.type }];
  }

  if (isTransfer(txInfo) && txInfo.to && txInfo.value && !txInfo.value.isZero()) {
    const asset = inferAssetInfo(txInfo);
    const value = txInfo.value;
    if (value.isNaN() || !value.isFinite()) {
      return [{ type: "other", operationType: "NONE", contractType: txInfo.type }];
    }
    const amount = BigInt(value.integerValue().toFixed(0));
    return [
      { type: "transfer", address: txInfo.from, peer: txInfo.to, asset, amount: -amount },
      { type: "transfer", address: txInfo.to, peer: txInfo.from, asset, amount },
    ];
  }

  const operationType = getOperationType(txInfo.type);
  return [{ type: "other", operationType: operationType, contractType: txInfo.type }];
}

function isTransfer(txInfo: TrongridTxInfo): boolean {
  return (
    txInfo.type === "TransferContract" ||
    txInfo.type === "TransferAssetContract" ||
    txInfo.tokenType === "trc20"
  );
}

function getOperationType(contractType: string): string {
  switch (contractType) {
    case "ContractApproval":
      return "APPROVE";
    case "ExchangeTransactionContract":
      return "OUT";
    case "VoteWitnessContract":
      return "VOTE";
    case "WithdrawBalanceContract":
      return "REWARD";
    case "FreezeBalanceContract":
    case "FreezeBalanceV2Contract":
      return "FREEZE";
    case "UnfreezeBalanceV2Contract":
      return "UNFREEZE";
    case "WithdrawExpireUnfreezeContract":
      return "WITHDRAW_EXPIRE_UNFREEZE";
    case "UnDelegateResourceContract":
      return "UNDELEGATE_RESOURCE";
    case "UnfreezeBalanceContract":
      return "LEGACY_UNFREEZE";
    default:
      return "NONE";
  }
}

function decodeHexAssetName(hexAssetName: string | undefined): string | undefined {
  if (!hexAssetName) return undefined;
  return Buffer.from(hexAssetName, "hex").toString("utf8");
}
