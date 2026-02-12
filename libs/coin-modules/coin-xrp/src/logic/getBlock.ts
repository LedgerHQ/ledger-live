import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { getLedgerByIndex } from "../network";
import type {
  AffectedNode,
  LedgerTxResponse,
  XrplOperation,
  ModifiedNodeData,
  CreatedNodeData,
  DeletedNodeData,
} from "../network/types";

const BLOCK_OPERATION_OTHER = "other";
const BLOCK_OPERATION_TRANSFER = "transfer";
const ASSETINFO_NATIVE: AssetInfo = { type: "native", name: "XRP" };
const TX_RESULT_TESSUCCESS = "tesSUCCESS";
const METADATA_NODE_ENTRYTYPE_ACCOUNTROOT = "AccountRoot";

/**
 * Creates an operation for an account balance change.
 * Returns a transfer operation for actual value transfers, or an "other" operation
 * for fee-only balance changes (e.g., AccountSet transactions).
 */
function createBalanceOperation(
  account: string,
  diff: bigint,
  fee: bigint,
  feesPayer: string,
): BlockOperation | null {
  if (diff === BigInt(0)) return null;

  // Adjust the fee payer's balance diff to exclude fees
  // (fees are reported separately in BlockTransaction.fees)
  let adjustedDiff = diff;
  if (account === feesPayer) {
    adjustedDiff = diff + fee;
  }

  return {
    type: BLOCK_OPERATION_TRANSFER,
    address: account,
    asset: ASSETINFO_NATIVE,
    amount: adjustedDiff,
  };
}

function mapModifiedNode(data: ModifiedNodeData, fee: bigint, feesPayer: string): BlockOperation[] {
  if (data.LedgerEntryType === METADATA_NODE_ENTRYTYPE_ACCOUNTROOT) {
    const before = data.PreviousFields?.Balance;
    const after = data.FinalFields?.Balance;
    const account = data.FinalFields?.Account;

    if (typeof before === "string" && typeof after === "string" && typeof account === "string") {
      const diff = BigInt(after) - BigInt(before);
      const op = createBalanceOperation(account, diff, fee, feesPayer);
      return op ? [op] : [];
    }

    return [];
  }

  return [{ type: BLOCK_OPERATION_OTHER, ...data }];
}

function mapCreatedNode(data: CreatedNodeData, fee: bigint, feesPayer: string): BlockOperation[] {
  if (data.LedgerEntryType === METADATA_NODE_ENTRYTYPE_ACCOUNTROOT) {
    const balance = data.NewFields?.Balance;
    const account = data.NewFields?.Account;

    if (typeof balance === "string" && typeof account === "string") {
      const diff = BigInt(balance);
      const op = createBalanceOperation(account, diff, fee, feesPayer);
      return op ? [op] : [];
    }
    return [];
  }

  return [{ type: BLOCK_OPERATION_OTHER, ...data }];
}

function mapDeletedNode(data: DeletedNodeData): BlockOperation[] {
  if (data.LedgerEntryType === METADATA_NODE_ENTRYTYPE_ACCOUNTROOT) {
    return [];
  }

  return [{ type: BLOCK_OPERATION_OTHER, ...data }];
}

function mapBlockInfo(result: LedgerTxResponse): BlockInfo {
  return {
    height: result.ledger_index,
    hash: result.ledger.ledger_hash,
    time: new Date(result.ledger.close_time_iso),
    parent: {
      height: result.ledger_index - 1,
      hash: result.ledger.parent_hash,
    },
  };
}

export async function getBlock(index: number): Promise<Block> {
  const epoch = new Date(0);
  if (index <= 0) {
    return { info: { height: index, hash: "", time: epoch }, transactions: [] };
  }

  const result = await getLedgerByIndex(index);
  return {
    info: mapBlockInfo(result),
    transactions: mapBlockTransactions(result.ledger.transactions),
  };
}

function mapBlockTransactions(txs: XrplOperation[]): BlockTransaction[] {
  return txs.map(blk => {
    const fee = BigInt(blk.tx_json.Fee);
    const feesPayer = blk.tx_json.Account;
    const isSuccess = blk.meta.TransactionResult === TX_RESULT_TESSUCCESS;

    const operations: BlockOperation[] = isSuccess
      ? (blk.meta.AffectedNodes ?? []).flatMap((node: AffectedNode) => {
          if ("ModifiedNode" in node) {
            return mapModifiedNode(node.ModifiedNode, fee, feesPayer);
          }
          if ("CreatedNode" in node) {
            return mapCreatedNode(node.CreatedNode, fee, feesPayer);
          }
          if ("DeletedNode" in node) {
            return mapDeletedNode(node.DeletedNode);
          }
          return [];
        })
      : [];

    return {
      hash: blk.hash,
      failed: !isSuccess,
      fees: fee,
      feesPayer,
      operations,
      details: blk.tx_json,
    };
  });
}
