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
  const txBySignature = indexTransactionsBySignature(parsed);

  const items: Operation[] = [];
  for (const sig of signatures) {
    const tx = txBySignature.get(sig.signature);
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
  const next = hasMore && !reachedMinHeightBoundary ? lastSig.signature : undefined;

  return { items, next };
}

/** JSON-RPC batch responses are not order-guaranteed, so pairing by array position is unsafe. */
function indexTransactionsBySignature(
  parsed: (ParsedTransactionWithMeta | null)[],
): Map<string, ParsedTransactionWithMeta> {
  const bySignature = new Map<string, ParsedTransactionWithMeta>();
  for (const tx of parsed) {
    if (!tx) continue;
    for (const signature of tx.transaction.signatures) {
      bySignature.set(signature, tx);
    }
  }
  return bySignature;
}

type TxMeta = {
  memo?: string;
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
/**
 * The RPC prefixes a memo with its byte length (`[5] hello`). Dropping the matched prefix rather
 * than slicing by the declared length, which counts bytes where `String` indexes UTF-16 units.
 */
export function dropMemoLengthPrefixIfAny(memo: string): string {
  return memo.replace(/^\[\d+\]\s/, "");
}

function buildTxMeta(sig: ConfirmedSignatureInfo, tx: ParsedTransactionWithMeta): TxMeta {
  return {
    ...(sig.memo ? { memo: dropMemoLengthPrefixIfAny(sig.memo) } : {}),
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
  feesPayer?: string | undefined;
};

function makeOperation(params: MakeOperationParams): Operation {
  const { address, opType, value, senders, recipients, asset, meta, operationIndex, details } =
    params;
  const feesPayer = "feesPayer" in params ? params.feesPayer : meta.feesPayer;
  return {
    id: `${address}-${meta.hash}-${opType}-${operationIndex}`,
    type: opType,
    senders,
    recipients,
    value,
    asset,
    // The memo belongs to the whole transaction, so every operation it produces carries it — the
    // same shape the account details drawer reads (`extra.memo`).
    ...(details || meta.memo
      ? { details: { ...details, ...(meta.memo ? { memo: meta.memo } : {}) } }
      : {}),
    tx: {
      hash: meta.hash,
      block: {
        height: meta.slot,
        hash: "", // Solana block hashes are not available in parsed tx data; no reorg risk so empty string per spec
        time: new Date(meta.blockTime * 1000),
      },
      fees: meta.fee,
      ...(feesPayer ? { feesPayer } : {}),
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
        feesPayer: undefined,
        ...(stakingOp.details ? { details: stakingOp.details } : {}),
      }),
    ];
  }

  const isFeePayer = accountIndex === 0;

  const accountOpType = detectAccountOperation(tx, isFeePayer);
  if (accountOpType) {
    return [
      makeOperation({
        address,
        opType: accountOpType,
        // The whole delta, fee included: the framework only adds the fee back for transfer and
        // delegation types, so these carry it themselves -- as they did on the legacy path.
        value: balanceDelta < 0n ? -balanceDelta : balanceDelta,
        senders: [],
        recipients: [],
        asset: { type: "native" },
        meta,
        operationIndex: 0,
      }),
    ];
  }

  const { opType, value } = classifyNativeTransfer(balanceDelta, isFeePayer, meta.fee);

  const { senders, recipients } = nativeParties(tx, opType, address, meta.fee);

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
 * Opting a token account in or out, freezing or thawing one. Ported from the legacy
 * `getMainAccOperationTypeFromTx`; without it an ATA creation reads as a plain fee payment.
 */
function detectAccountOperation(
  tx: ParsedTransactionWithMeta,
  isFeePayer: boolean,
): string | undefined {
  const ixs = getParsedInstructions(tx);
  if (ixs.length !== 1) return undefined;

  const [ix] = ixs;
  switch (ix.program) {
    case PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT:
      // The fee payer is the one funding someone else's account; anyone else is opting in.
      return ix.type === "associate" ? (isFeePayer ? "OPT_OUT" : "OPT_IN") : undefined;
    case PARSED_PROGRAMS.SPL_TOKEN:
    case PARSED_PROGRAMS.SPL_TOKEN_2022:
      switch (ix.type) {
        case "closeAccount":
          return "OPT_OUT";
        case "freezeAccount":
          return "FREEZE";
        case "thawAccount":
          return "UNFREEZE";
      }
      return undefined;
    default:
      return undefined;
  }
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

type Parties = { senders: string[]; recipients: string[] };

/**
 * Every account the transaction debited or credited, not just the first one -- a batched transfer
 * pays several recipients, and keeping one silently drops the rest. Ported from the legacy
 * `getMainSendersRecipients`.
 */
function nativeParties(
  tx: ParsedTransactionWithMeta,
  opType: string,
  address: string,
  txFee: bigint,
): Parties {
  const txMeta = tx.meta!;

  // An SPL transfer to an account that already exists shows up on the main account as a fee
  // payment; the parties worth naming are the token's, not the lamports'.
  if (opType === "FEES") return tokenParties(tx);

  if (opType === "OPT_IN") {
    const incoming = (txMeta.postTokenBalances ?? []).filter(b => b.owner === address);
    return {
      senders: incoming.map(b => b.mint),
      recipients: incoming.map(
        b => tx.transaction.message.accountKeys[b.accountIndex]?.pubkey.toBase58() ?? address,
      ),
    };
  }

  if (opType !== "IN" && opType !== "OUT") return { senders: [], recipients: [] };

  const { preBalances, postBalances } = txMeta;
  return tx.transaction.message.accountKeys.reduce<Parties>(
    (acc, account, i) => {
      const delta = BigInt(postBalances[i]) - BigInt(preBalances[i]);
      if (delta < 0n) {
        // The fee payer is not a sender when the fee is all it spent.
        if (i !== 0 || -delta !== txFee) acc.senders.push(account.pubkey.toBase58());
      } else if (delta > 0n) {
        acc.recipients.push(account.pubkey.toBase58());
      }
      return acc;
    },
    { senders: [], recipients: [] },
  );
}

/** Same enumeration over token balances: every owner whose token holding moved. */
function tokenParties(tx: ParsedTransactionWithMeta): Parties {
  const txMeta = tx.meta!;
  const { preTokenBalances, postTokenBalances } = txMeta;

  return tx.transaction.message.accountKeys.reduce<Parties>(
    (acc, account, i) => {
      const pre = preTokenBalances?.find(b => b.accountIndex === i);
      const post = postTokenBalances?.find(b => b.accountIndex === i);
      if (!pre && !post) return acc;

      const delta =
        BigInt(post?.uiTokenAmount.amount ?? 0) - BigInt(pre?.uiTokenAmount.amount ?? 0);
      const party = post?.owner ?? account.pubkey.toBase58();
      if (delta < 0n) acc.senders.push(party);
      else if (delta > 0n) acc.recipients.push(party);
      return acc;
    },
    { senders: [], recipients: [] },
  );
}

type ParsedIx = { program: string; type: string; info: Record<string, unknown> | undefined };

/**
 * Parsed instructions, memos excluded: the shape checks below count instructions, and a memo is
 * the user's, not the transaction's intent. Legacy filtered the same way (`parseTxInstructions`).
 */
function getParsedInstructions(tx: ParsedTransactionWithMeta): ParsedIx[] {
  const results: ParsedIx[] = [];
  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix)) continue;
    if ((ix as { program?: string }).program === PARSED_PROGRAMS.SPL_MEMO) continue;
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
 * Value semantics (accounting for the generic-coin-framework adapter which adds fee
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
 * generic-coin-framework bridge (`getAccountShape`) excludes them from the parent
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

  const accountKeys = tx.transaction.message.accountKeys.map(k => k.pubkey.toBase58());
  const tokenChanges = computeTokenBalanceDeltas(
    address,
    preTokenBalances,
    postTokenBalances,
    accountKeys,
  );
  const ops: Operation[] = [];
  let operationIndex = 1;
  const burned = isBurnTransaction(tx);
  // Invariant across the loop below: it reads the transaction, never the change.
  const parties = tokenParties(tx);
  // Freezing or thawing leaves the balance untouched, so the change carries a zero delta. Legacy
  // emitted an operation for every transaction reaching the token account, zero delta included --
  // and with it a `NONE` for each one that merely brushed past. Only these two are worth a row.
  const frozenOpType = detectTokenAccountState(tx);

  for (const [, change] of tokenChanges) {
    if (change.delta === 0n && !frozenOpType) continue;
    const op = buildTokenOperation(
      address,
      change,
      meta,
      operationIndex,
      parties,
      frozenOpType ?? (burned ? "BURN" : undefined),
    );
    ops.push(op);
    operationIndex++;
  }

  return ops;
}

function buildTokenOperation(
  address: string,
  change: TokenChange,
  meta: TxMeta,
  operationIndex: number,
  parties: Parties,
  opTypeOverride?: string,
): Operation {
  const { mint, delta, tokenType, owner } = change;
  // Emit the operation against the wallet owner (not the queried address): when
  // coin-service queries by a token-account/ATA address, senders/recipients and
  // assetOwner must still resolve to the wallet, matching a wallet-address query.
  const asset: AssetInfo = { type: tokenType, assetReference: mint, assetOwner: owner };

  // Burning leaves the account like a send would, but the tokens go nowhere -- legacy typed it
  // `BURN` (`getTokenAccOperationType`) and the history reads wrong without it.
  const opType = opTypeOverride ?? (delta > 0n ? "IN" : "OUT");
  const value = delta > 0n ? delta : -delta;

  const { senders, recipients } = parties;

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

type TokenChange = {
  mint: string;
  delta: bigint;
  tokenType: SolanaTokenProgram;
  owner: string;
};

/**
 * A token balance belongs to the queried address when the address is either the
 * wallet owner (Solana's `owner` field) or the token account itself. Ledger Live
 * addresses token sub-accounts by their token-account (ATA) address, so
 * coin-service queries operations by that address — but Solana's balance records
 * only carry the wallet `owner`. Matching both makes token operations surface for
 * either kind of query.
 */
function tokenBalanceMatchesAddress(
  tb: TokenBalance,
  address: string,
  accountKeys: string[],
): boolean {
  return tb.owner === address || accountKeys[tb.accountIndex] === address;
}

/** Maps a program ID to the internal token type name, defaulting to SPL_TOKEN for unknown IDs. */
function resolveTokenType(programId: string | undefined): SolanaTokenProgram {
  if (programId && PROGRAM_ID_TO_NAME[programId]) return PROGRAM_ID_TO_NAME[programId];
  return PARSED_PROGRAMS.SPL_TOKEN;
}

/**
 * Computes per-mint balance deltas for the given address across a transaction.
 * The address may be the wallet owner or one of its token accounts (see
 * {@link tokenBalanceMatchesAddress}).
 *
 * Two passes:
 *  1. Iterate postTokenBalances for the address → delta = post − (matched pre or 0).
 *     Covers tokens that still exist after the tx (increase, decrease, or unchanged).
 *  2. Iterate preTokenBalances for entries not yet seen → delta = −pre.
 *     Covers tokens fully consumed by the tx (e.g. account closed / all tokens sent away).
 */
function computeTokenBalanceDeltas(
  address: string,
  preTokenBalances: TokenBalance[],
  postTokenBalances: TokenBalance[],
  accountKeys: string[],
): Map<string, TokenChange> {
  const changes = new Map<string, TokenChange>();

  const preBalancesByMint = new Map<string, bigint>();
  for (const pre of preTokenBalances) {
    if (!tokenBalanceMatchesAddress(pre, address, accountKeys)) continue;
    if (!preBalancesByMint.has(pre.mint)) {
      preBalancesByMint.set(pre.mint, BigInt(pre.uiTokenAmount.amount));
    }
  }

  for (const post of postTokenBalances) {
    if (!tokenBalanceMatchesAddress(post, address, accountKeys)) continue;
    const tokenType = resolveTokenType(post.programId);
    const key = `${post.mint}-${tokenType}`;
    const postAmount = BigInt(post.uiTokenAmount.amount);
    const preAmount = preBalancesByMint.get(post.mint) ?? 0n;
    changes.set(key, {
      mint: post.mint,
      delta: postAmount - preAmount,
      tokenType,
      owner: post.owner ?? address,
    });
  }

  for (const pre of preTokenBalances) {
    if (!tokenBalanceMatchesAddress(pre, address, accountKeys)) continue;
    const tokenType = resolveTokenType(pre.programId);
    const key = `${pre.mint}-${tokenType}`;
    if (!changes.has(key)) {
      changes.set(key, {
        mint: pre.mint,
        delta: -BigInt(pre.uiTokenAmount.amount),
        tokenType,
        owner: pre.owner ?? address,
      });
    }
  }

  return changes;
}

/** A lone freeze or thaw: the authority locks or unlocks the account without moving anything. */
function detectTokenAccountState(tx: ParsedTransactionWithMeta): string | undefined {
  const ixs = getParsedInstructions(tx);
  if (ixs.length !== 1) return undefined;
  const [ix] = ixs;
  if (ix.program !== PARSED_PROGRAMS.SPL_TOKEN && ix.program !== PARSED_PROGRAMS.SPL_TOKEN_2022) {
    return undefined;
  }
  if (ix.type === "freezeAccount") return "FREEZE";
  return ix.type === "thawAccount" ? "UNFREEZE" : undefined;
}

/** A lone `burn` instruction: the tokens leave the account without a recipient. */
function isBurnTransaction(tx: ParsedTransactionWithMeta): boolean {
  const ixs = getParsedInstructions(tx);
  if (ixs.length !== 1) return false;
  const [ix] = ixs;
  return (
    (ix.program === PARSED_PROGRAMS.SPL_TOKEN || ix.program === PARSED_PROGRAMS.SPL_TOKEN_2022) &&
    (ix.type === "burn" || ix.type === "burnChecked")
  );
}
