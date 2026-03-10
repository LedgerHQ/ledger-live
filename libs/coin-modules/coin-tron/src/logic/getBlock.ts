import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import {
  fetchTronTxDetail,
  getBlock as networkGetBlock,
  getBlockWithTransactions,
} from "../network";
import { encode58Check } from "../network/format";
import { inferAssetInfo } from "../network/trongrid/trongrid-adapters";
import type { BlockTransactionAPI } from "../network/types";
import { abiDecodeTrc20Transfer } from "../network/utils";
import type { TrongridTxInfo, TrongridTxType } from "../types";

type BlockTxInfo = TrongridTxInfo & { fee: BigNumber };

export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height <= 0) {
    throw new Error(`Invalid block height: ${height}`);
  }

  const block = await networkGetBlock(height);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}

export async function getBlock(height: number): Promise<Block> {
  if (height <= 0) {
    throw new Error(`Invalid block height: ${height}`);
  }

  const data = await getBlockWithTransactions(height);
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
  const feesById = await fetchMissingFees(rawTxs);

  const transactions: BlockTransaction[] = rawTxs
    .map(tx => toBlockTransaction(tx, blockTimestamp, info.height, feesById))
    .filter((tx): tx is BlockTransaction => tx !== null);

  return { info, transactions };
}

async function fetchMissingFees(
  txs: BlockTransactionAPI[],
): Promise<Map<string, number>> {
  const feesById = new Map<string, number>();

  const txsMissingFees = txs.filter(tx => tx.ret?.[0]?.fee === undefined);
  if (txsMissingFees.length === 0) return feesById;

  await promiseAllBatched(3, txsMissingFees, async tx => {
    try {
      const detail = await fetchTronTxDetail(tx.txID);
      if (detail.fee !== undefined) {
        feesById.set(tx.txID, detail.fee);
      }
    } catch (error) {
      log("warn", `Failed to fetch fee for tx ${tx.txID}, falling back to 0`, { error });
    }
  });

  return feesById;
}

function toBlockTransaction(
  tx: BlockTransactionAPI,
  blockTimestamp: number,
  blockHeight: number,
  feesById: Map<string, number>,
): BlockTransaction | null {
  const txInfo = formatBlockTransaction(tx, blockTimestamp, blockHeight);
  if (!txInfo) return null;

  const fee = txInfo.fee.gt(0) ? txInfo.fee : new BigNumber(feesById.get(tx.txID) ?? 0);

  return {
    hash: txInfo.txID,
    failed: txInfo.hasFailed,
    fees: BigInt(fee.toFixed(0)),
    feesPayer: txInfo.from,
    operations: txInfo.hasFailed ? [] : toBlockOperations(txInfo),
  };
}

function formatBlockTransaction(
  tx: BlockTransactionAPI,
  blockTimestamp: number,
  blockHeight: number,
): BlockTxInfo | null {
  const contract = tx.raw_data.contract[0];
  if (!contract) return null;

  const type = contract.type as TrongridTxType;
  const params = contract.parameter.value;
  const ownerAddress = params.owner_address;
  if (!ownerAddress) return null;

  const from = encode58Check(ownerAddress);
  const contractRet = tx.ret?.[0]?.contractRet ?? "SUCCESS";
  const hasFailed = contractRet !== "SUCCESS";
  const fee = new BigNumber(tx.ret?.[0]?.fee ?? 0);

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

  const tokenId = isTrc10
    ? params.asset_name
    : isTrc20 && params.contract_address
      ? encode58Check(params.contract_address)
      : undefined;

  return {
    txID: tx.txID,
    date: new Date(blockTimestamp),
    type,
    tokenId,
    tokenType,
    tokenAddress:
      isTrc20 && params.contract_address ? encode58Check(params.contract_address) : undefined,
    from,
    to,
    value,
    fee,
    blockHeight,
    hasFailed,
  };
}

function toBlockOperations(txInfo: BlockTxInfo): BlockOperation[] {
  if (isTransfer(txInfo) && txInfo.to && txInfo.value && !txInfo.value.isZero()) {
    const asset = inferAssetInfo(txInfo);
    const amount = BigInt(txInfo.value.toFixed(0));
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
    (txInfo.type === "TriggerSmartContract" && txInfo.tokenType === "trc20")
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
