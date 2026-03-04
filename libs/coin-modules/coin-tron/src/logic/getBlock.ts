import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { getBlock as getBlockHeader, getBlockWithTransactions } from "../network";
import { encode58Check } from "../network/format";
import type { BlockTransactionAPI, BlockWithTransactionsAPI } from "../network/types";

type Contract = BlockTransactionAPI["raw_data"]["contract"][number];
type ContractValue = Contract["parameter"]["value"];

const ASSET_NATIVE: AssetInfo = { type: "native", name: "TRX" };
const TX_SUCCESS = "SUCCESS";

export async function getBlockInfo(height: number): Promise<BlockInfo> {
  const epoch = new Date(0);
  if (height <= 0) {
    return { height, hash: "", time: epoch };
  }

  const block = await getBlockHeader(height);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? epoch,
  };
}

export async function getBlock(height: number): Promise<Block> {
  const epoch = new Date(0);
  if (height <= 0) {
    return { info: { height, hash: "", time: epoch }, transactions: [] };
  }

  const data = await getBlockWithTransactions(height);
  return {
    info: mapBlockInfo(data, height),
    transactions: mapBlockTransactions(data.transactions ?? []),
  };
}

function mapBlockInfo(data: BlockWithTransactionsAPI, height: number): BlockInfo {
  const timestamp = data.block_header.raw_data.timestamp;
  const parentHash = data.block_header.raw_data.parentHash;

  const info: BlockInfo = {
    height: data.block_header.raw_data.number ?? height,
    hash: data.blockID,
    time: timestamp ? new Date(timestamp) : new Date(0),
  };

  if (parentHash && height > 0) {
    info.parent = {
      height: height - 1,
      hash: parentHash,
    };
  }

  return info;
}

function mapBlockTransactions(txs: BlockTransactionAPI[]): BlockTransaction[] {
  return txs.map(tx => {
    const isSuccess = tx.ret?.[0]?.contractRet === TX_SUCCESS;
    const fee = BigInt(tx.ret?.[0]?.fee ?? 0);
    const contract = tx.raw_data.contract[0];
    const feesPayer = encodeAddress(contract?.parameter?.value?.owner_address ?? "");

    return {
      hash: tx.txID,
      failed: !isSuccess,
      fees: fee,
      feesPayer,
      operations: isSuccess ? mapOperations(contract) : [],
      details: {
        contractType: contract?.type,
      },
    };
  });
}

function mapOperations(contract: Contract): BlockOperation[] {
  if (!contract) return [];

  const value = contract.parameter.value;
  const type = contract.type;

  switch (type) {
    case "TransferContract":
      return mapTransferContract(value);
    case "TransferAssetContract":
      return mapTransferAssetContract(value);
    case "TriggerSmartContract":
      return mapTriggerSmartContract(value);
    default:
      return [{ type: "other", contractType: type }];
  }
}

function mapTransferContract(value: ContractValue): BlockOperation[] {
  const from = encodeAddress(value.owner_address);
  const to = encodeAddress(value.to_address ?? "");
  const amount = BigInt(value.amount ?? 0);

  if (!from || !to || amount === BigInt(0)) return [];

  return [
    {
      type: "transfer",
      address: from,
      peer: to,
      asset: ASSET_NATIVE,
      amount: -amount,
    },
    {
      type: "transfer",
      address: to,
      peer: from,
      asset: ASSET_NATIVE,
      amount: amount,
    },
  ];
}

function mapTransferAssetContract(value: ContractValue): BlockOperation[] {
  const from = encodeAddress(value.owner_address);
  const to = encodeAddress(value.to_address ?? "");
  const amount = BigInt(value.amount ?? 0);
  const assetName = value.asset_name ?? "";

  if (!from || !to || amount === BigInt(0)) return [];

  const asset: AssetInfo = {
    type: "trc10",
    assetReference: assetName,
    name: assetName,
  };

  return [
    {
      type: "transfer",
      address: from,
      peer: to,
      asset,
      amount: -amount,
    },
    {
      type: "transfer",
      address: to,
      peer: from,
      asset,
      amount: amount,
    },
  ];
}

function mapTriggerSmartContract(value: ContractValue): BlockOperation[] {
  const from = encodeAddress(value.owner_address);
  const contractAddress = encodeAddress(value.contract_address ?? "");
  const data = value.data;

  if (!data || data.length < 136) {
    return [{ type: "other", contractType: "TriggerSmartContract", from, contractAddress }];
  }

  const methodId = data.slice(0, 8);
  if (methodId !== "a9059cbb") {
    return [
      { type: "other", contractType: "TriggerSmartContract", from, contractAddress, methodId },
    ];
  }

  const toHex = "41" + data.slice(32, 72);
  const to = encodeAddress(toHex);
  const amountHex = data.slice(72, 136);
  const amount = BigInt("0x" + amountHex);

  if (!to || amount === BigInt(0)) {
    return [{ type: "other", contractType: "TriggerSmartContract", from, contractAddress }];
  }

  const asset: AssetInfo = {
    type: "trc20",
    assetReference: contractAddress,
  };

  return [
    {
      type: "transfer",
      address: from,
      peer: to,
      asset,
      amount: -amount,
    },
    {
      type: "transfer",
      address: to,
      peer: from,
      asset,
      amount: amount,
    },
  ];
}

function encodeAddress(hexAddress: string): string {
  if (!hexAddress) return "";
  try {
    return encode58Check(hexAddress);
  } catch {
    return hexAddress;
  }
}
