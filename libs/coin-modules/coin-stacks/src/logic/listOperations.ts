import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { cvToJSON, deserializeCV } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { hexMemoToString, bufferMemoToString } from "../common-logic";
import { MAX_STACKS_PAGE_LIMIT, SEND_MANY_MEMO_CONTRACT_ID } from "../constants";
import { fetchAllTransactions } from "../network/api";
import type { DecodedSendManyFunctionArgsCV, TransactionResponse } from "../types/api";
import { NATIVE_ASSET, tokenAsset } from "./getBalance";

function toOperation(params: {
  id: string;
  type: string;
  senders: string[];
  recipients: string[];
  value: bigint;
  asset: AssetInfo;
  hash: string;
  blockHeight: number;
  blockHash: string;
  fees: bigint;
  date: Date;
  failed: boolean;
  memo?: string;
}): Operation {
  return {
    id: params.id,
    type: params.type,
    senders: params.senders,
    recipients: params.recipients,
    value: params.value,
    asset: params.asset,
    details: params.memo ? { memo: params.memo } : undefined,
    tx: {
      hash: params.hash,
      block: { height: params.blockHeight, hash: params.blockHash, time: params.date },
      fees: params.fees,
      date: params.date,
      failed: params.failed,
    },
  };
}

function nativeTransferOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, fee_rate, block_height, block_hash, burn_block_time, sender_address, tx_status } =
    tx.tx;
  const { stx_received, stx_sent } = tx;
  if (!tx.tx.token_transfer) return [];

  const recipient = tx.tx.token_transfer.recipient_address;
  const memo = hexMemoToString(tx.tx.token_transfer.memo);
  const fees = BigInt(fee_rate || "0");
  const date = new Date(burn_block_time * 1000);
  const failed = tx_status !== "success";
  const blockHeight = block_height;

  const ops: Operation[] = [];
  if (address === sender_address) {
    ops.push(
      toOperation({
        id: `${tx_id}-OUT`,
        type: "OUT",
        senders: [sender_address],
        recipients: [recipient],
        value: BigInt(new BigNumber(stx_sent).toFixed(0)),
        asset: NATIVE_ASSET,
        hash: tx_id,
        blockHeight,
        blockHash: block_hash,
        fees,
        date,
        failed,
        memo,
      }),
    );
  }
  if (address === recipient) {
    ops.push(
      toOperation({
        id: `${tx_id}-IN`,
        type: "IN",
        senders: [sender_address],
        recipients: [recipient],
        value: BigInt(new BigNumber(stx_received).toFixed(0)),
        asset: NATIVE_ASSET,
        hash: tx_id,
        blockHeight,
        blockHash: block_hash,
        fees,
        date,
        failed,
        memo,
      }),
    );
  }
  return ops;
}

function sendManyOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, fee_rate, block_height, block_hash, burn_block_time, sender_address, tx_status } =
    tx.tx;
  if (!tx.tx.contract_call) return [];

  const fees = BigInt(fee_rate || "0");
  const date = new Date(burn_block_time * 1000);
  const failed = tx_status !== "success";

  const decoded: DecodedSendManyFunctionArgsCV = cvToJSON(
    deserializeCV(tx.tx.contract_call.function_args[0].hex),
  );

  const ops: Operation[] = [];
  decoded.value.forEach((entry, idx) => {
    const recipient = entry.value.to.value;
    const value = BigInt(entry.value.ustx.value);
    const memo = entry.value.memo ? hexMemoToString(entry.value.memo.value) : undefined;

    if (address === sender_address) {
      ops.push(
        toOperation({
          id: `${tx_id}-OUT-${idx}`,
          type: "OUT",
          senders: [sender_address],
          recipients: [recipient],
          value,
          asset: NATIVE_ASSET,
          hash: tx_id,
          blockHeight: block_height,
          blockHash: block_hash,
          fees,
          date,
          failed,
          memo,
        }),
      );
    }
    if (address === recipient) {
      ops.push(
        toOperation({
          id: `${tx_id}-IN-${idx}`,
          type: "IN",
          senders: [sender_address],
          recipients: [recipient],
          value,
          asset: NATIVE_ASSET,
          hash: tx_id,
          blockHeight: block_height,
          blockHash: block_hash,
          fees,
          date,
          failed,
          memo,
        }),
      );
    }
  });
  return ops;
}

function sip010TransferOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, fee_rate, block_height, block_hash, burn_block_time, tx_status } = tx.tx;
  const contractCall = tx.tx.contract_call;
  if (!contractCall) return [];

  const args = contractCall.function_args;
  if (args.length !== 4) return [];

  const [valueArg, senderArg, receiverArg, memoArg] = args;
  const sender = cvToJSON(deserializeCV(senderArg.hex)).value;
  const receiver = cvToJSON(deserializeCV(receiverArg.hex)).value;
  const value = BigInt(cvToJSON(deserializeCV(valueArg.hex)).value);
  const memo = bufferMemoToString(cvToJSON(deserializeCV(memoArg.hex)).value);

  if (address !== sender && address !== receiver) return [];

  // The asset name comes from the transfer's own Fungible post-condition, same source
  // `network/transformers.ts`'s `getAssetNameFromPostConditions` uses -- a `transfer` call
  // without one cannot be identified without an extra FT-metadata round trip, so it's dropped.
  const assetName = tx.tx.post_conditions?.find(p => p.type === "fungible")?.asset.asset_name;
  if (!assetName) return [];

  // Lowercased to match `fetchAllTokenBalances`'s own normalization (network/api.ts) -- otherwise
  // an operation's assetReference wouldn't match the balance/registry key for the same token.
  const asset = tokenAsset(`${contractCall.contract_id}::${assetName}`.toLowerCase(), address);
  const fees = BigInt(fee_rate || "0");
  const date = new Date(burn_block_time * 1000);
  const failed = tx_status !== "success";
  const type = address === sender ? "OUT" : "IN";

  return [
    toOperation({
      id: `${tx_id}-${type}`,
      type,
      senders: [sender],
      recipients: [receiver],
      value,
      asset,
      hash: tx_id,
      blockHeight: block_height,
      blockHash: block_hash,
      fees,
      date,
      failed,
      memo,
    }),
  ];
}

/** Any other contract call (e.g. pox-5 `stake`/`unstake`) involving `address` as sender: a generic
 * operation carrying the function name as `type`, following Tron's `hasFailed`-independent
 * pattern of classifying every contract-call kind rather than only known transfer shapes. */
function genericContractCallOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, fee_rate, block_height, block_hash, burn_block_time, sender_address, tx_status } =
    tx.tx;
  const contractCall = tx.tx.contract_call;
  if (!contractCall || sender_address !== address) return [];

  return [
    toOperation({
      id: `${tx_id}-${contractCall.function_name}`,
      type: contractCall.function_name,
      senders: [sender_address],
      recipients: [],
      value: 0n,
      asset: NATIVE_ASSET,
      hash: tx_id,
      blockHeight: block_height,
      blockHash: block_hash,
      fees: BigInt(fee_rate || "0"),
      date: new Date(burn_block_time * 1000),
      failed: tx_status !== "success",
    }),
  ];
}

function toOperations(tx: TransactionResponse, address: string): Operation[] {
  if (tx.tx.tx_type === "token_transfer") {
    return nativeTransferOperations(tx, address);
  }

  if (tx.tx.tx_type === "contract_call") {
    const functionName = tx.tx.contract_call?.function_name;
    const contractId = tx.tx.contract_call?.contract_id;
    if (functionName === "send-many" && contractId === SEND_MANY_MEMO_CONTRACT_ID) {
      return sendManyOperations(tx, address);
    }
    if (functionName === "transfer") return sip010TransferOperations(tx, address);
    return genericContractCallOperations(tx, address);
  }

  return [];
}

export async function listOperations(
  address: string,
  { limit, order = "desc", minHeight = 0, cursor }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > MAX_STACKS_PAGE_LIMIT) {
    throw new Error(`limit must be <= ${MAX_STACKS_PAGE_LIMIT} for Stacks (indexer restriction)`);
  }
  if (cursor) {
    throw new Error("cursor is not supported for Stacks: the full history is fetched in one page");
  }

  const transactions = await fetchAllTransactions(address);
  const sorted = transactions
    .flatMap(tx => toOperations(tx, address))
    // No incremental fetch on the indexer side (the full history is always pulled above), so
    // minHeight is applied here instead of being rejected -- getAccountShape's re-sync always
    // passes a non-zero minHeight once an account has any operation.
    .filter(op => op.tx.block.height >= minHeight)
    .sort((a, b) =>
      order === "asc"
        ? a.tx.date.getTime() - b.tx.date.getTime()
        : b.tx.date.getTime() - a.tx.date.getTime(),
    );
  // No cursor support (the full history is always fetched above), so a limit only caps the
  // returned page size -- it does not enable fetching the remainder via `next`.
  const items = limit !== undefined ? sorted.slice(0, limit) : sorted;

  return { items, next: undefined };
}
