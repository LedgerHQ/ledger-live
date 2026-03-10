import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-framework/api/index";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { ParsedTransactionWithMeta, TokenBalance } from "@solana/web3.js";
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
  const rpcLimit = limit ?? 100;
  const opts: { before?: string; limit?: number } = { limit: rpcLimit };

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

  if (order === "asc") {
    items.reverse();
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
  recentBlockhash: string;
  fee: bigint;
  feesPayer: string;
  failed: boolean;
};

function buildTxMeta(
  sig: { signature: string; slot: number; blockTime?: number | null; err: unknown },
  tx: ParsedTransactionWithMeta,
): TxMeta {
  return {
    hash: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime!,
    recentBlockhash: tx.transaction.message.recentBlockhash,
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
): Operation {
  return {
    id: `${address}-${meta.hash}-${opType}-${operationIndex}`,
    type: opType,
    senders,
    recipients,
    value,
    asset,
    tx: {
      hash: meta.hash,
      block: {
        height: meta.slot,
        hash: meta.recentBlockhash,
        time: new Date(meta.blockTime * 1000),
      },
      fees: meta.fee,
      feesPayer: meta.feesPayer,
      date: new Date(meta.blockTime * 1000),
      failed: meta.failed,
    },
  };
}

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
    };

    const opType = delta > 0n ? "IN" : "OUT";
    const value = delta > 0n ? delta : -delta;

    const counterparty = findTokenCounterparty(
      address,
      mint,
      opType === "IN" ? preTokenBalances : postTokenBalances,
      opType === "IN" ? postTokenBalances : preTokenBalances,
      tx.transaction.message.accountKeys.map(k => k.pubkey.toBase58()),
    );

    const senders = opType === "OUT" ? [address] : counterparty ? [counterparty] : [];
    const recipients = opType === "IN" ? [address] : counterparty ? [counterparty] : [];

    ops.push(makeOperation(address, opType, value, senders, recipients, asset, meta, operationIndex));
    operationIndex++;
  }

  return ops;
}

type TokenChange = { mint: string; delta: bigint; tokenType: SolanaTokenProgram };

function resolveTokenType(programId: string | undefined): SolanaTokenProgram {
  if (programId && PROGRAM_ID_TO_NAME[programId]) return PROGRAM_ID_TO_NAME[programId];
  return PARSED_PROGRAMS.SPL_TOKEN;
}

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

function findTokenCounterparty(
  ownerAddress: string,
  mint: string,
  _preTokenBalances: TokenBalance[],
  postTokenBalances: TokenBalance[],
  accountKeys: string[],
): string | undefined {
  const counterpartyEntry = postTokenBalances.find(
    b => b.owner !== ownerAddress && b.mint === mint,
  );
  if (counterpartyEntry?.owner) return counterpartyEntry.owner;
  return accountKeys.find(k => k !== ownerAddress);
}
