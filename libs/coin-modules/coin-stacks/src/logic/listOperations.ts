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
import { fetchAllTransactions, fetchFungibleTokenMetadataCached } from "../network/api";
import { findFinalTokenId, resolveTokenId } from "../network/transformers";
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
  nonce: number;
  // The sender pays the fee unless a sponsor does; the sponsor's address isn't needed, only that
  // the account didn't pay, so a sponsored transaction has no `feesPayer`.
  feesPayer?: string;
  memo?: string;
  internal?: boolean;
}): Operation {
  return {
    id: params.id,
    type: params.type,
    senders: params.senders,
    recipients: params.recipients,
    value: params.value,
    asset: params.asset,
    // `ledgerOpType` is required by `generic-coin-framework/buildSubAccounts.ts`, which rebuilds
    // each token sub-account operation's own `type` from this field instead of the top-level one
    // above (`op.extra?.ledgerOpType`, generic-coin-framework/utils.ts) -- without it every SIP-010
    // sub-account operation's type is silently `undefined`. Same convention as coin-vechain/
    // coin-multiversx's own `listOperations.ts`.
    details: {
      ledgerOpType: params.type,
      sequence: BigInt(params.nonce),
      ...(params.memo ? { memo: params.memo } : {}),
      ...(params.internal ? { internal: true } : {}),
    },
    tx: {
      hash: params.hash,
      block: { height: params.blockHeight, hash: params.blockHash, time: params.date },
      fees: params.fees,
      ...(params.feesPayer ? { feesPayer: params.feesPayer } : {}),
      date: params.date,
      failed: params.failed,
    },
  };
}

/** The fields every operation of `tx` shares, whatever its direction or asset. */
function txFields(tx: TransactionResponse) {
  const { tx_id, fee_rate, nonce, block_height, block_hash, burn_block_time, tx_status } = tx.tx;
  return {
    hash: tx_id,
    blockHeight: block_height,
    blockHash: block_hash,
    // A sponsored transaction's fee is paid by the sponsor, so it is reported as zero: the framework
    // adds `fees` to an outgoing native value, and values a failed operation at `fees`, whoever
    // paid them -- omitting `feesPayer` alone would still charge the sender the sponsor's fee.
    fees: tx.tx.sponsored ? 0n : BigInt(fee_rate || "0"),
    date: new Date(burn_block_time * 1000),
    failed: tx_status !== "success",
    nonce,
    feesPayer: tx.tx.sponsored ? undefined : tx.tx.sender_address,
  };
}

function nativeTransferOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, sender_address } = tx.tx;
  const { stx_received } = tx;
  if (!tx.tx.token_transfer) return [];

  const recipient = tx.tx.token_transfer.recipient_address;
  const memo = hexMemoToString(tx.tx.token_transfer.memo);

  const ops: Operation[] = [];
  if (address === sender_address) {
    ops.push(
      toOperation({
        ...txFields(tx),
        id: `${tx_id}-OUT`,
        type: "OUT",
        senders: [sender_address],
        recipients: [recipient],
        // The transferred amount alone: the framework adds the fee to an outgoing native value, and
        // `stx_sent` already includes it, so using it would count the fee twice.
        value: BigInt(tx.tx.token_transfer.amount),
        asset: NATIVE_ASSET,
        memo,
      }),
    );
  }
  if (address === recipient) {
    ops.push(
      toOperation({
        ...txFields(tx),
        id: `${tx_id}-IN`,
        type: "IN",
        senders: [sender_address],
        recipients: [recipient],
        value: BigInt(new BigNumber(stx_received).toFixed(0)),
        asset: NATIVE_ASSET,
        memo,
      }),
    );
  }
  return ops;
}

/** A send-many is one transaction, so it yields one OUT for the whole batch (as the legacy bridge
 * does), with one `internal` operation per recipient carrying that recipient's amount and memo, and
 * at most one IN for a recipient, summing every entry addressed to it. One operation per entry
 * would not work: the framework keys operations by hash and type, so they would overwrite each
 * other and leave only the last recipient's amount. */
function sendManyOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, sender_address } = tx.tx;
  if (!tx.tx.contract_call) return [];

  const decoded: DecodedSendManyFunctionArgsCV = cvToJSON(
    deserializeCV(tx.tx.contract_call.function_args[0].hex),
  );
  const entries = decoded.value.map(entry => ({
    recipient: entry.value.to.value,
    value: BigInt(entry.value.ustx.value),
    memo: entry.value.memo ? hexMemoToString(entry.value.memo.value) : undefined,
  }));

  const ops: Operation[] = [];
  if (address === sender_address) {
    ops.push(
      toOperation({
        ...txFields(tx),
        id: `${tx_id}-OUT`,
        type: "OUT",
        senders: [sender_address],
        recipients: [],
        value: entries.reduce((sum, entry) => sum + entry.value, 0n),
        asset: NATIVE_ASSET,
      }),
      ...entries.map((entry, idx) =>
        toOperation({
          ...txFields(tx),
          id: `${tx_id}-OUT-${idx}`,
          type: "OUT",
          senders: [sender_address],
          recipients: [entry.recipient],
          value: entry.value,
          asset: NATIVE_ASSET,
          memo: entry.memo,
          internal: true,
        }),
      ),
    );
  }

  const received = entries.filter(entry => entry.recipient === address);
  if (received.length > 0) {
    ops.push(
      toOperation({
        ...txFields(tx),
        id: `${tx_id}-IN`,
        type: "IN",
        senders: [sender_address],
        recipients: [address],
        value: received.reduce((sum, entry) => sum + entry.value, 0n),
        asset: NATIVE_ASSET,
      }),
    );
  }
  return ops;
}

/** The token's registry key (`CONTRACT_ID::ASSET_NAME`, lowercased), resolved exactly as the
 * legacy bridge does (`network/transformers.ts`'s `extractContractTransactions`): the asset name
 * comes from the transfer's Fungible post-condition, or from the contract's FT metadata when there
 * is none (common for liquid-staking tokens), then is canonicalized against the registry.
 *
 * A failing FT-metadata lookup propagates, as on the legacy bridge: the generic sync is incremental
 * (it resumes above the newest stored operation), so swallowing it would permanently drop the
 * transfer, or store it under an uncanonicalized id, instead of retrying on the next sync. */
async function resolveSip010AssetReference(
  contractId: string,
  tx: TransactionResponse,
  resolvedTokenIds: Record<string, string>,
): Promise<string | undefined> {
  const assetName = tx.tx.post_conditions?.find(p => p.type === "fungible")?.asset.asset_name;
  const tokenId = await resolveTokenId(contractId, fetchFungibleTokenMetadataCached, assetName);
  if (!tokenId) return undefined;
  const finalTokenId = await findFinalTokenId(
    tokenId,
    resolvedTokenIds,
    fetchFungibleTokenMetadataCached,
  );
  resolvedTokenIds[tokenId] = finalTokenId;
  // Lowercased to match `fetchAllTokenBalances`'s own normalization (network/api.ts) -- otherwise
  // an operation's assetReference wouldn't match the balance/registry key for the same token.
  return finalTokenId.toLowerCase();
}

async function sip010TransferOperations(
  tx: TransactionResponse,
  address: string,
  resolvedTokenIds: Record<string, string>,
): Promise<Operation[]> {
  const { tx_id } = tx.tx;
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

  const assetReference = await resolveSip010AssetReference(
    contractCall.contract_id,
    tx,
    resolvedTokenIds,
  );
  if (!assetReference) return [];

  const asset = tokenAsset(assetReference, address);
  const type = address === sender ? "OUT" : "IN";

  return [
    toOperation({
      ...txFields(tx),
      id: `${tx_id}-${type}`,
      type,
      senders: [sender],
      recipients: [receiver],
      value,
      asset,
      memo,
    }),
  ];
}

/** Any other contract call (e.g. pox-5 `stake`/`unstake`) involving `address` as sender: a generic
 * operation carrying the function name as `type`, following Tron's `hasFailed`-independent
 * pattern of classifying every contract-call kind rather than only known transfer shapes. */
function genericContractCallOperations(tx: TransactionResponse, address: string): Operation[] {
  const { tx_id, sender_address } = tx.tx;
  const contractCall = tx.tx.contract_call;
  if (!contractCall || sender_address !== address) return [];

  return [
    toOperation({
      ...txFields(tx),
      id: `${tx_id}-${contractCall.function_name}`,
      type: contractCall.function_name,
      senders: [sender_address],
      recipients: [],
      value: 0n,
      asset: NATIVE_ASSET,
    }),
  ];
}

async function toOperations(
  tx: TransactionResponse,
  address: string,
  resolvedTokenIds: Record<string, string>,
): Promise<Operation[]> {
  if (tx.tx.tx_type === "token_transfer") {
    return nativeTransferOperations(tx, address);
  }

  if (tx.tx.tx_type === "contract_call") {
    const functionName = tx.tx.contract_call?.function_name;
    const contractId = tx.tx.contract_call?.contract_id;
    if (functionName === "send-many" && contractId === SEND_MANY_MEMO_CONTRACT_ID) {
      return sendManyOperations(tx, address);
    }
    if (functionName === "transfer") return sip010TransferOperations(tx, address, resolvedTokenIds);
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

  // No incremental fetch on the indexer side (the full history is always pulled), so minHeight is
  // applied here instead of being rejected -- getAccountShape's re-sync always passes a non-zero
  // minHeight once an account has any operation. It filters transactions before they are converted,
  // so a token-metadata lookup that fails for an already-synced transfer cannot abort the sync.
  const transactions = (await fetchAllTransactions(address)).filter(
    tx => tx.tx.block_height >= minHeight,
  );
  // Sequential, so each token id is resolved (and its metadata fetched) once per call.
  const resolvedTokenIds: Record<string, string> = {};
  const operations: Operation[] = [];
  for (const tx of transactions) {
    operations.push(...(await toOperations(tx, address, resolvedTokenIds)));
  }
  operations.sort((a, b) =>
    order === "asc"
      ? a.tx.date.getTime() - b.tx.date.getTime()
      : b.tx.date.getTime() - a.tx.date.getTime(),
  );
  // No cursor support (the full history is always fetched above), so a limit only caps the
  // returned page size -- it does not enable fetching the remainder via `next`.
  const items = limit !== undefined ? operations.slice(0, limit) : operations;

  return { items, next: undefined };
}
