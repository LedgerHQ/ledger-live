import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-framework/api/index";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type {
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  SignaturesForAddressOptions,
  TokenBalance,
} from "@solana/web3.js";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import type { SolanaTokenProgram } from "../types";

const PROGRAM_ID_TO_NAME: Record<string, SolanaTokenProgram> = {
  [TOKEN_PROGRAM_ID.toBase58()]: PARSED_PROGRAMS.SPL_TOKEN,
  [TOKEN_2022_PROGRAM_ID.toBase58()]: PARSED_PROGRAMS.SPL_TOKEN_2022,
};

export async function listOperations(
  api: ChainAPI,
  address: string,
  { minHeight, cursor, order, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (order === "asc") {
    throw new Error("ascending order is not supported");
  }

  const rpcLimit = limit ?? 100;
  const opts: SignaturesForAddressOptions = { limit: rpcLimit };

  if (cursor) {
    opts.before = cursor;
  }

  const signatures = await api.getSignaturesForAddress(address, opts);

  if (signatures.length === 0) {
    return { items: [], next: undefined };
  }

  const sigStrings = signatures.map(s => s.signature);
  const parsed = await api.getParsedTransactions(sigStrings);

  const items: Operation[] = [];
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    const tx = parsed[i];
    if (!tx || !tx.meta || !sig.blockTime) continue;

    if (minHeight > 0 && sig.slot < minHeight) continue;

    const txMeta = buildTxMeta(sig, tx);

    const nativeOps = parseNativeOperations(address, tx, txMeta);
    const tokenOps = parseTokenOperations(address, tx, txMeta);

    items.push(...nativeOps, ...tokenOps);
  }

  const lastSig = signatures[signatures.length - 1];
  const hasMore = signatures.length === rpcLimit;
  const next = items.length > 0 && hasMore ? lastSig.signature : undefined;

  return { items, next };
}

type TxMeta = {
  hash: string;
  slot: number;
  blockTime: number;
  fee: bigint;
  feesPayer: string;
  failed: boolean;
};

/**
 * Extracts a flat metadata object from the RPC signature info and parsed transaction,
 * normalising types (e.g. fee → bigint) so downstream helpers don't depend on RPC shapes.
 * Callers guarantee that `sig.blockTime` and `tx.meta` are non-null before calling.
 */
function buildTxMeta(sig: ConfirmedSignatureInfo, tx: ParsedTransactionWithMeta): TxMeta {
  return {
    hash: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime!,
    fee: BigInt(tx.meta!.fee),
    feesPayer: tx.transaction.message.accountKeys[0]?.pubkey.toBase58(),
    failed: !!sig.err,
  };
}

function makeOperation(
  address: string,
  opType: string,
  value: bigint,
  senders: string[],
  recipients: string[],
  asset: AssetInfo,
  meta: TxMeta,
  operationIndex: number,
  details?: Record<string, unknown>,
): Operation {
  return {
    id: `${address}-${meta.hash}-${opType}-${operationIndex}`,
    type: opType,
    senders,
    recipients,
    value,
    asset,
    ...(details ? { details } : {}),
    tx: {
      hash: meta.hash,
      block: {
        height: meta.slot,
        hash: "", // Solana block hashes are not available in parsed tx data; no reorg risk so empty string per spec
        time: new Date(meta.blockTime * 1000),
      },
      fees: meta.fee,
      feesPayer: meta.feesPayer,
      date: new Date(meta.blockTime * 1000),
      failed: meta.failed,
    },
  };
}

/**
 * Derives a single native-SOL operation from a transaction's pre/post lamport balances.
 *
 * Operation type depends on the address role:
 *   - Fee payer (accountIndex 0): fee is subtracted from balanceDelta before classification.
 *     delta < 0 → OUT, delta > 0 → IN, delta == 0 → FEES (only fees were paid).
 *   - Other accounts: raw delta determines the type (IN / OUT / NONE).
 *
 * Counterparty is the first account whose lamport balance changed (heuristic — may be
 * inaccurate for complex multi-account transactions).
 */
function parseNativeOperations(
  address: string,
  tx: ParsedTransactionWithMeta,
  meta: TxMeta,
): Operation[] {
  const { message } = tx.transaction;
  const accountIndex = message.accountKeys.findIndex(k => k.pubkey.toBase58() === address);
  if (accountIndex < 0) return [];

  const { preBalances, postBalances } = tx.meta!;
  const balanceDelta = BigInt(postBalances[accountIndex]) - BigInt(preBalances[accountIndex]);
  const isFeePayer = accountIndex === 0;
  const txFee = meta.fee;

  let opType: string;
  let value: bigint;

  if (isFeePayer) {
    const deltaWithoutFee = balanceDelta + txFee;
    if (deltaWithoutFee < 0n) {
      opType = "OUT";
      value = -deltaWithoutFee;
    } else if (deltaWithoutFee > 0n) {
      opType = "IN";
      value = deltaWithoutFee;
    } else {
      opType = "FEES";
      value = txFee;
    }
  } else {
    if (balanceDelta > 0n) {
      opType = "IN";
      value = balanceDelta;
    } else if (balanceDelta < 0n) {
      opType = "OUT";
      value = -balanceDelta;
    } else {
      opType = "NONE";
      value = 0n;
    }
  }

  const counterpartyIndex = message.accountKeys.findIndex(
    (_k, idx) =>
      idx !== accountIndex && BigInt(postBalances[idx]) - BigInt(preBalances[idx]) !== 0n,
  );
  const counterparty =
    counterpartyIndex >= 0 ? message.accountKeys[counterpartyIndex].pubkey.toBase58() : undefined;

  const senders =
    opType === "OUT" || opType === "FEES" ? [address] : counterparty ? [counterparty] : [];
  const recipients = opType === "IN" ? [address] : counterparty ? [counterparty] : [];

  return [makeOperation(address, opType, value, senders, recipients, { type: "native" }, meta, 0)];
}

/**
 * Derives SPL / Token-2022 operations from pre/post token balance arrays.
 *
 * For each mint where the owner's balance changed, emits an IN or OUT operation.
 * Zero-delta tokens are silently skipped.
 * operationIndex starts at 1 (0 is reserved for the native operation).
 *
 * Token operations are marked `internal: true` in their details so that the
 * generic-alpaca bridge (`getAccountShape`) excludes them from the parent
 * account's operations list — they only surface as sub-account operations.
 * Without this flag, a single token transfer would produce duplicate parent
 * operations (one native + one token) with potentially different IDs when
 * the native op type differs from the token op type (e.g. send-all with
 * ATA close yields native IN + token OUT).
 */
function parseTokenOperations(
  address: string,
  tx: ParsedTransactionWithMeta,
  meta: TxMeta,
): Operation[] {
  const preTokenBalances = tx.meta?.preTokenBalances ?? [];
  const postTokenBalances = tx.meta?.postTokenBalances ?? [];
  if (preTokenBalances.length === 0 && postTokenBalances.length === 0) return [];

  const tokenChanges = computeTokenBalanceDeltas(address, preTokenBalances, postTokenBalances);
  const ops: Operation[] = [];
  let operationIndex = 1;

  for (const [, change] of tokenChanges) {
    const { mint, delta, tokenType } = change;
    if (delta === 0n) continue;

    const asset: AssetInfo = {
      type: tokenType,
      assetReference: mint,
      assetOwner: address,
    };

    const opType = delta > 0n ? "IN" : "OUT";
    const value = delta > 0n ? delta : -delta;

    const counterparty = findTokenCounterparty(
      address,
      mint,
      preTokenBalances,
      postTokenBalances,
      tx.transaction.message.accountKeys.map(k => k.pubkey.toBase58()),
    );

    const senders = opType === "OUT" ? [address] : counterparty ? [counterparty] : [];
    const recipients = opType === "IN" ? [address] : counterparty ? [counterparty] : [];

    ops.push(
      makeOperation(address, opType, value, senders, recipients, asset, meta, operationIndex, {
        ledgerOpType: opType,
        assetAmount: value.toString(),
        assetSenders: senders,
        assetRecipients: recipients,
        internal: true,
      }),
    );
    operationIndex++;
  }

  return ops;
}

type TokenChange = { mint: string; delta: bigint; tokenType: SolanaTokenProgram };

/** Maps a program ID to the internal token type name, defaulting to SPL_TOKEN for unknown IDs. */
function resolveTokenType(programId: string | undefined): SolanaTokenProgram {
  if (programId && PROGRAM_ID_TO_NAME[programId]) return PROGRAM_ID_TO_NAME[programId];
  return PARSED_PROGRAMS.SPL_TOKEN;
}

/**
 * Computes per-mint balance deltas for the given owner across a transaction.
 *
 * Two passes:
 *  1. Iterate postTokenBalances for the owner → delta = post − (matched pre or 0).
 *     Covers tokens that still exist after the tx (increase, decrease, or unchanged).
 *  2. Iterate preTokenBalances for entries not yet seen → delta = −pre.
 *     Covers tokens fully consumed by the tx (e.g. account closed / all tokens sent away).
 */
function computeTokenBalanceDeltas(
  ownerAddress: string,
  preTokenBalances: TokenBalance[],
  postTokenBalances: TokenBalance[],
): Map<string, TokenChange> {
  const changes = new Map<string, TokenChange>();

  for (const post of postTokenBalances) {
    if (post.owner !== ownerAddress) continue;
    const tokenType = resolveTokenType(post.programId);
    const key = `${post.mint}-${tokenType}`;
    const postAmount = BigInt(post.uiTokenAmount.amount);
    const preEntry = preTokenBalances.find(
      pre => pre.owner === ownerAddress && pre.mint === post.mint,
    );
    const preAmount = preEntry ? BigInt(preEntry.uiTokenAmount.amount) : 0n;
    changes.set(key, { mint: post.mint, delta: postAmount - preAmount, tokenType });
  }

  for (const pre of preTokenBalances) {
    if (pre.owner !== ownerAddress) continue;
    const tokenType = resolveTokenType(pre.programId);
    const key = `${pre.mint}-${tokenType}`;
    if (!changes.has(key)) {
      changes.set(key, { mint: pre.mint, delta: -BigInt(pre.uiTokenAmount.amount), tokenType });
    }
  }

  return changes;
}

/**
 * Best-effort counterparty detection for token transfers.
 *
 * Searches both post and pre token balance arrays for another wallet owner
 * of the same mint. Post is checked first because the recipient may not exist
 * in pre when their ATA is created in the same transaction.
 *
 * Falls back to the first different account key when neither array has an
 * owner-populated entry for a counterparty.
 */
function findTokenCounterparty(
  ownerAddress: string,
  mint: string,
  preTokenBalances: TokenBalance[],
  postTokenBalances: TokenBalance[],
  accountKeys: string[],
): string | undefined {
  for (const balances of [postTokenBalances, preTokenBalances]) {
    const entry = balances.find(b => b.owner && b.owner !== ownerAddress && b.mint === mint);
    if (entry?.owner) return entry.owner;
  }
  return accountKeys.find(k => k !== ownerAddress);
}
