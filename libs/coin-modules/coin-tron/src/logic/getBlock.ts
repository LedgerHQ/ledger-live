import type {
  Block,
  BlockInfo,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { getBlock as networkGetBlock, getBlockWithTransactions } from "../network";
import { encode58Check } from "../network/format";

export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height <= 0) {
    return { height, hash: "", time: new Date(0) };
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
    return { info: { height, hash: "", time: new Date(0) }, transactions: [] };
  }

  const data = await getBlockWithTransactions(height);
  const header = data.block_header.raw_data;

  const info: BlockInfo = {
    height: header.number ?? height,
    hash: data.blockID,
    time: header.timestamp ? new Date(header.timestamp) : new Date(0),
  };

  if (header.parentHash && height > 0) {
    info.parent = { height: height - 1, hash: header.parentHash };
  }

  const transactions: BlockTransaction[] = (data.transactions ?? []).map(tx => {
    const contract = tx.raw_data.contract[0];
    const ownerAddress = contract?.parameter?.value?.owner_address;

    return {
      hash: tx.txID,
      failed: tx.ret?.[0]?.contractRet !== "SUCCESS",
      fees: BigInt(tx.ret?.[0]?.fee ?? 0),
      feesPayer: ownerAddress ? safeEncode58(ownerAddress) : "",
      operations: [{ type: "other" as const, contractType: contract?.type }],
    };
  });

  return { info, transactions };
}

function safeEncode58(hex: string): string {
  try {
    return encode58Check(hex);
  } catch {
    return hex;
  }
}
