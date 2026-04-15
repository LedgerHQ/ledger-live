import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
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
    if (!tx?.meta || sig.blockTime === null || sig.blockTime === undefined) continue;

    if (minHeight > 0 && sig.slot < minHeight) continue;

    const txMeta = buildTxMeta(sig, tx);

    const nativeOps = parseNativeOperations(address, tx, txMeta);
    const tokenOps = parseTokenOperations(address, tx, txMeta);

    items.push(...nativeOps, ...tokenOps);
  }

  const lastSig = signatures[signatures.length - 1];
  const hasMore = signatures.length === rpcLimit;
  const reachedMinHeightBoundary = minHeight > 0 && lastSig.slot < minHeight;
  const next =
    items.length > 0 && hasMore && !reachedMinHeightBoundary ? lastSig.signature : undefined;

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

type MakeOperationParams = {
  address: string;
  opType: string;
  value: bigint;
  senders: string[];
  recipients: string[];
  asset: AssetInfo;
  meta: TxMeta;
  operationIndex: number;
  details?: Record<string, unknown>;
};

function makeOperation(params: MakeOperationParams): Operation {
  const { address, opType, value, senders, recipients, asset, meta, operationIndex, details } =
    params;
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
 * Staking transactions (create+delegate, delegate, deactivate, withdraw) are detected
 * from parsed instructions and mapped to DELEGATE / UNDELEGATE / WITHDRAW_UNBONDED types.
 */
function parseNativeOperations(
  address: string,
  tx: ParsedTransactionWithMeta,
  meta: TxMeta,
): Operation[] {
  const { message } = tx.transaction;
  const accountIndex = message.accountKeys.findIndex(k => k.pubkey.toBase58() === address);
  if (accountIndex < 0) return [];

  const txMeta = tx.meta!;
  const { preBalances, postBalances } = txMeta;
  const balanceDelta = BigInt(postBalances[accountIndex]) - BigInt(preBalances[accountIndex]);

  const stakingOp = detectStakingOperation(tx, balanceDelta);
  if (stakingOp) {
    return [
      makeOperation({
        address,
        opType: stakingOp.opType,
        value: stakingOp.value,
        senders: [],
        recipients: [],
        asset: { type: "native" },
        meta,
        operationIndex: 0,
        ...(stakingOp.details ? { details: stakingOp.details } : {}),
      }),
    ];
  }

  const isFeePayer = accountIndex === 0;
  const { opType, value } = classifyNativeTransfer(balanceDelta, isFeePayer, meta.fee);

  const counterparty = findNativeCounterparty(message.accountKeys, accountIndex, txMeta);
  const { senders, recipients } = buildParties(opType, address, counterparty);

  return [
    makeOperation({
      address,
      opType,
      value,
      senders,
      recipients,
      asset: { type: "native" },
      meta,
      operationIndex: 0,
    }),
  ];
}

/**
 * Classifies the native transfer direction from a lamport balance delta.
 *
 *   - Fee payer: fee is added back before classification.
 *     delta < 0 → OUT, delta > 0 → IN, delta == 0 → FEES (only fees were paid).
 *   - Other accounts: raw delta determines the type (IN / OUT / NONE).
 */
function classifyNativeTransfer(
  balanceDelta: bigint,
  isFeePayer: boolean,
  txFee: bigint,
): { opType: string; value: bigint } {
  if (isFeePayer) {
    const deltaWithoutFee = balanceDelta + txFee;
    if (deltaWithoutFee < 0n) return { opType: "OUT", value: -deltaWithoutFee };
    if (deltaWithoutFee > 0n) return { opType: "IN", value: deltaWithoutFee };
    return { opType: "FEES", value: txFee };
  }

  if (balanceDelta > 0n) return { opType: "IN", value: balanceDelta };
  if (balanceDelta < 0n) return { opType: "OUT", value: -balanceDelta };
  return { opType: "NONE", value: 0n };
}

/**
 * Heuristic counterparty: first account whose lamport balance changed.
 * May be inaccurate for complex multi-account transactions.
 */
function findNativeCounterparty(
  accountKeys: ParsedTransactionWithMeta["transaction"]["message"]["accountKeys"],
  accountIndex: number,
  txMeta: NonNullable<ParsedTransactionWithMeta["meta"]>,
): string | undefined {
  const { preBalances, postBalances } = txMeta;
  const idx = accountKeys.findIndex(
    (_k, i) => i !== accountIndex && BigInt(postBalances[i]) - BigInt(preBalances[i]) !== 0n,
  );
  return idx >= 0 ? accountKeys[idx].pubkey.toBase58() : undefined;
}

function buildParties(
  opType: string,
  address: string,
  counterparty: string | undefined,
): { senders: string[]; recipients: string[] } {
  const otherParty = counterparty ? [counterparty] : [];

  const isSender = opType === "OUT" || opType === "FEES";
  const senders = isSender ? [address] : otherParty;

  const recipients = opType === "IN" ? [address] : otherParty;

  return { senders, recipients };
}

type ParsedIx = { program: string; type: string; info: Record<string, unknown> | undefined };

function getParsedInstructions(tx: ParsedTransactionWithMeta): ParsedIx[] {
  const results: ParsedIx[] = [];
  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix)) continue;
    const raw = ix as { program?: string; parsed?: unknown };
    if (typeof raw.parsed !== "object" || raw.parsed === null) continue;
    const parsed = raw.parsed as { type?: string; info?: Record<string, unknown> };
    if (typeof parsed.type !== "string") continue;
    results.push({
      program: raw.program ?? "",
      type: parsed.type,
      info: parsed.info ?? undefined,
    });
  }
  return results;
}

/**
 * Detects staking program instructions and returns a typed operation.
 *
 * Value semantics (accounting for the generic-alpaca adapter which adds fee
 * for DELEGATE and UNDELEGATE but not WITHDRAW_UNBONDED):
 * - DELEGATE / UNDELEGATE: value = 0  (adapter adds fee → final = fee)
 * - WITHDRAW_UNBONDED:    value = fee (adapter keeps as-is → final = fee)
 */
type StakingResult = {
  opType: string;
  value: bigint;
  details: Record<string, unknown> | undefined;
};

function detectStakingOperation(
  tx: ParsedTransactionWithMeta,
  balanceDelta: bigint,
): StakingResult | null {
  const ixs = getParsedInstructions(tx);

  if (ixs.length === 3) {
    const [first, second, third] = ixs;
    if (
      first.program === "system" &&
      (first.type === "createAccountWithSeed" || first.type === "createAccount") &&
      second.program === "stake" &&
      second.type === "initialize" &&
      third.program === "stake" &&
      third.type === "delegate"
    ) {
      return makeDelegateResult(third.info, balanceDelta);
    }
  }

  if (ixs.length !== 1) {
    return null;
  }

  const ix = ixs[0];
  if (ix.program !== "stake") {
    return null;
  }

  switch (ix.type) {
    case "delegate":
      return makeDelegateResult(ix.info, balanceDelta);
    case "deactivate":
      return { opType: "UNDELEGATE", value: 0n, details: undefined };
    case "withdraw": {
      const stakeAccount = ix.info?.stakeAccount as string | undefined;
      const lamports = ix.info?.lamports as number | undefined;
      const txFee = BigInt(tx.meta!.fee);
      return {
        opType: "WITHDRAW_UNBONDED",
        value: txFee,
        details:
          stakeAccount && lamports
            ? { stake: { address: stakeAccount, amount: BigInt(lamports) } }
            : undefined,
      };
    }
    default:
      return null;
  }
}

function makeDelegateResult(
  info: Record<string, unknown> | undefined,
  balanceDelta: bigint,
): StakingResult {
  const voteAccount = info?.voteAccount as string | undefined;
  const absDelta = balanceDelta < 0n ? -balanceDelta : balanceDelta;
  return {
    opType: "DELEGATE",
    value: 0n,
    details: voteAccount ? { stake: { address: voteAccount, amount: absDelta } } : undefined,
  };
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
  const accountKeys = tx.transaction.message.accountKeys.map(k => k.pubkey.toBase58());
  const ops: Operation[] = [];
  let operationIndex = 1;

  for (const [, change] of tokenChanges) {
    if (change.delta === 0n) continue;
    const op = buildTokenOperation(
      address,
      change,
      preTokenBalances,
      postTokenBalances,
      accountKeys,
      meta,
      operationIndex,
    );
    ops.push(op);
    operationIndex++;
  }

  return ops;
}

function buildTokenOperation(
  address: string,
  change: TokenChange,
  preTokenBalances: TokenBalance[],
  postTokenBalances: TokenBalance[],
  accountKeys: string[],
  meta: TxMeta,
  operationIndex: number,
): Operation {
  const { mint, delta, tokenType } = change;
  const asset: AssetInfo = { type: tokenType, assetReference: mint, assetOwner: address };

  const opType = delta > 0n ? "IN" : "OUT";
  const value = delta > 0n ? delta : -delta;

  const counterparty = findTokenCounterparty(
    address,
    mint,
    preTokenBalances,
    postTokenBalances,
    accountKeys,
  );
  const { senders, recipients } = buildParties(opType, address, counterparty);

  return makeOperation({
    address,
    opType,
    value,
    senders,
    recipients,
    asset,
    meta,
    operationIndex,
    details: {
      ledgerOpType: opType,
      assetAmount: value.toString(),
      assetSenders: senders,
      assetRecipients: recipients,
      internal: true,
    },
  });
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

  const preBalancesByMint = new Map<string, bigint>();
  for (const pre of preTokenBalances) {
    if (pre.owner !== ownerAddress) continue;
    if (!preBalancesByMint.has(pre.mint)) {
      preBalancesByMint.set(pre.mint, BigInt(pre.uiTokenAmount.amount));
    }
  }

  for (const post of postTokenBalances) {
    if (post.owner !== ownerAddress) continue;
    const tokenType = resolveTokenType(post.programId);
    const key = `${post.mint}-${tokenType}`;
    const postAmount = BigInt(post.uiTokenAmount.amount);
    const preAmount = preBalancesByMint.get(post.mint) ?? 0n;
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
