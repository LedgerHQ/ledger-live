import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import api from "../network";
import type { BlockInfo as SidecarBlockInfo } from "../network/types";

export async function getBlock(height: number): Promise<Block> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlock: height must be a positive integer, got ${height}`);
  }

  const data = await api.getBlockByHeight(height);
  const info = toBlockInfo(data, height);
  const transactions = toBlockTransactions(data);

  return { info, transactions };
}

function toBlockInfo(data: SidecarBlockInfo, height: number): BlockInfo {
  const info: BlockInfo = {
    height: parseInt(data.number),
    hash: data.hash,
    time: new Date(),
  };
  if (height > 1) {
    info.parent = { height: height - 1, hash: data.parentHash };
  }
  return info;
}

function toBlockTransactions(data: SidecarBlockInfo): BlockTransaction[] {
  return data.extrinsics
    .filter(ext => ext.signature !== null)
    .map(ext => {
      const tx: BlockTransaction = {
        hash: ext.hash,
        failed: !ext.success,
        fees: extractFees(ext),
        operations: ext.success ? extractOperations(ext) : [],
      };
      const signer = extractSigner(ext);
      if (signer) {
        tx.feesPayer = signer;
      }
      return tx;
    });
}

function extractFees(ext: SidecarBlockInfo["extrinsics"][number]): bigint {
  if (!ext.paysFee) return BigInt(0);

  for (const event of ext.events) {
    if (
      event.method.pallet === "transactionPayment" &&
      event.method.method === "TransactionFeePaid"
    ) {
      const actualFee = event.data[1];
      if (actualFee !== undefined) {
        return BigInt(String(actualFee));
      }
    }
  }

  return BigInt(0);
}

function extractSigner(ext: SidecarBlockInfo["extrinsics"][number]): string | undefined {
  if (ext.signature && typeof ext.signature === "object" && "signer" in ext.signature) {
    const signer = (ext.signature as Record<string, unknown>).signer;
    if (typeof signer === "string") return signer;
    if (signer && typeof signer === "object" && "id" in signer) {
      return String((signer as Record<string, unknown>).id);
    }
  }
  return undefined;
}

const BALANCE_TRANSFER_METHODS = new Set([
  "transfer",
  "transferKeepAlive",
  "transferAllowDeath",
  "transferAll",
  "forceTransfer",
]);

function extractOperations(ext: SidecarBlockInfo["extrinsics"][number]): BlockOperation[] {
  if (ext.method.pallet !== "balances" || !BALANCE_TRANSFER_METHODS.has(ext.method.method)) {
    return [{ type: "other" }];
  }

  const signer = extractSigner(ext);
  if (!signer) return [{ type: "other" }];

  const amount = extractTransferAmount(ext);
  if (amount === BigInt(0)) return [{ type: "other" }];

  const dest = extractTransferDest(ext);
  if (!dest) return [{ type: "other" }];

  return [
    { type: "transfer", address: signer, peer: dest, asset: { type: "native" }, amount: -amount },
    { type: "transfer", address: dest, peer: signer, asset: { type: "native" }, amount },
  ];
}

function extractTransferAmount(ext: SidecarBlockInfo["extrinsics"][number]): bigint {
  for (const event of ext.events) {
    if (event.method.pallet === "balances" && event.method.method === "Transfer") {
      const amount = event.data[2];
      if (amount !== undefined) {
        return BigInt(String(amount));
      }
    }
  }
  return BigInt(0);
}

function extractTransferDest(ext: SidecarBlockInfo["extrinsics"][number]): string | undefined {
  for (const event of ext.events) {
    if (event.method.pallet === "balances" && event.method.method === "Transfer") {
      const to = event.data[1];
      if (to !== undefined) return String(to);
    }
  }
  return undefined;
}
