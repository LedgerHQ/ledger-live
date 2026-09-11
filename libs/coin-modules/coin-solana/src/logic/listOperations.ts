import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import chunk from "lodash/chunk";
import type {
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  SignaturesForAddressOptions,
  TokenBalance,
} from "@solana/web3.js";
import { getTokenAccountProgramId } from "../helpers/token";
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
  const decoded = decodeCursor(cursor, address);
  let before = decoded.cursors;
  let activeSources =
    cursor && !decoded.legacy ? Object.keys(before) : await signatureSources(api, address);

  const items: Operation[] = [];

  // `paginateOperations` stops on an empty page even when a cursor comes with it.
  for (;;) {
    const batched = await api.getSignaturesForAddressBatch(
      activeSources.map(source => ({
        address: source,
        opts: {
          limit: rpcLimit,
          ...(before[source] ? { before: before[source] } : {}),
        } satisfies SignaturesForAddressOptions,
      })),
    );
    const perSource = activeSources.map((source, index) => ({
      source,
      signatures: batched[index] ?? [],
    }));

    const seen = new Set<string>();
    const fromTokenStreamOnly = new Set<string>();
    const sourced: Array<{ source: string; signature: ConfirmedSignatureInfo }> = [];
    for (const { source, signatures: sourceSignatures } of perSource) {
      for (const signature of sourceSignatures) {
        if (seen.has(signature.signature)) continue;
        seen.add(signature.signature);
        if (source !== address) fromTokenStreamOnly.add(signature.signature);
        sourced.push({ source, signature });
      }
    }

    if (sourced.length === 0) {
      return { items, next: undefined };
    }

    sourced.sort((a, b) => b.signature.slot - a.signature.slot);

    const page = sourced.slice(0, rpcLimit);
    const signatures = page.map(entry => entry.signature);

    // A signature this source fetched is behind the page only if this source put it in `sourced`
    // and the slice cut it; one another source contributed was handled there.
    const cut = new Set(
      sourced.slice(rpcLimit).map(entry => `${entry.source}|${entry.signature.signature}`),
    );

    const nextCursors: Record<string, string> = {};
    for (const { source, signatures: sourceSignatures } of perSource) {
      let covered = 0;
      while (
        covered < sourceSignatures.length &&
        !cut.has(`${source}|${sourceSignatures[covered].signature}`)
      ) {
        covered++;
      }
      if (covered === sourceSignatures.length && sourceSignatures.length < rpcLimit) continue;

      const last = sourceSignatures[covered - 1];
      if (!last) {
        nextCursors[source] = before[source] ?? "";
      } else if (!(minHeight > 0 && last.slot < minHeight)) {
        nextCursors[source] = last.signature;
      }
    }

    const txBySignature = new Map<string, ParsedTransactionWithMeta>();
    for (const batch of chunk(
      signatures.map(s => s.signature),
      PARSED_TRANSACTIONS_BATCH_SIZE,
    )) {
      for (const [signature, tx] of indexTransactionsBySignature(
        await api.getParsedTransactions(batch),
      )) {
        txBySignature.set(signature, tx);
      }
    }

    for (const sig of signatures) {
      const tx = txBySignature.get(sig.signature);
      if (!tx?.meta || sig.blockTime === null || sig.blockTime === undefined) continue;

      if (minHeight > 0 && sig.slot < minHeight) continue;

      if (fromTokenStreamOnly.has(sig.signature) && mentions(tx, address)) continue;

      const txMeta = buildTxMeta(sig, tx);

      const nativeOps = parseNativeOperations(address, tx, txMeta);
      const tokenOps = parseTokenOperations(address, tx, txMeta);

      items.push(...nativeOps, ...tokenOps);
    }

    const unchanged =
      Object.keys(nextCursors).length === Object.keys(before).length &&
      Object.entries(nextCursors).every(([source, sig]) => before[source] === sig);
    if (items.length > 0 || Object.keys(nextCursors).length === 0 || unchanged) {
      return { items, next: encodeCursor(nextCursors) };
    }

    before = nextCursors;
    activeSources = Object.keys(nextCursors);
  }
}

/** The RPC payload is capped near 50 KB; `network/chain/web3.ts` uses the same size. */
const PARSED_TRANSACTIONS_BATCH_SIZE = 100;

function mentions(tx: ParsedTransactionWithMeta, address: string): boolean {
  return tx.transaction.message.accountKeys.some(key => key.pubkey.toBase58() === address);
}

/**
 * Auxiliary token accounts are left out: an operation names its account by owner and mint alone,
 * so their activity would land on the associated account, which is the only one `getBalance`
 * reports.
 */
async function signatureSources(api: ChainAPI, address: string): Promise<string[]> {
  const owner = new PublicKey(address);
  const [splTokenAccounts, token2022Accounts] = await Promise.all([
    api.getParsedTokenAccountsByOwner(address).then(res => res.value),
    api.getParsedToken2022AccountsByOwner(address).then(res => res.value),
  ]);

  const associated = [
    ...splTokenAccounts.map(account => ({ account, program: PARSED_PROGRAMS.SPL_TOKEN })),
    ...token2022Accounts.map(account => ({ account, program: PARSED_PROGRAMS.SPL_TOKEN_2022 })),
  ].flatMap(({ account, program }) => {
    const mint = account.account.data.parsed.info.mint as string;
    const expected = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      owner,
      undefined,
      getTokenAccountProgramId(program),
    );
    return expected.equals(account.pubkey) ? [account.pubkey.toBase58()] : [];
  });

  return [address, ...associated];
}

/** `legacy` marks a bare owner signature, minted before token streams existed. */
function decodeCursor(
  cursor: string | undefined,
  address: string,
): { cursors: Record<string, string>; legacy: boolean } {
  if (!cursor) return { cursors: {}, legacy: false };
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { cursors: parsed as Record<string, string>, legacy: false };
    }
  } catch {
    // Not one of ours: fall through to the bare-signature reading.
  }
  return { cursors: { [address]: cursor }, legacy: true };
}

function encodeCursor(cursors: Record<string, string>): string | undefined {
  if (Object.keys(cursors).length === 0) return undefined;
  return Buffer.from(JSON.stringify(cursors)).toString("base64");
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

function detectAccountOperation(
  tx: ParsedTransactionWithMeta,
  isFeePayer: boolean,
): string | undefined {
  const ixs = getParsedInstructions(tx);
  if (ixs.length !== 1) return undefined;

  const [ix] = ixs;
  switch (ix.program) {
    case PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT:
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

function nativeParties(
  tx: ParsedTransactionWithMeta,
  opType: string,
  address: string,
  txFee: bigint,
): Parties {
  const txMeta = tx.meta!;

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
        if (i !== 0 || -delta !== txFee) acc.senders.push(account.pubkey.toBase58());
      } else if (delta > 0n) {
        acc.recipients.push(account.pubkey.toBase58());
      }
      return acc;
    },
    { senders: [], recipients: [] },
  );
}

/**
 * Without a `mint`, every token the transaction moved counts — which is what a fee-only native
 * operation needs. With one, a transaction touching several mints (a swap) keeps each operation's
 * counterparties to its own asset.
 */
function tokenParties(tx: ParsedTransactionWithMeta, mint?: string): Parties {
  const txMeta = tx.meta!;
  const { preTokenBalances, postTokenBalances } = txMeta;

  return tx.transaction.message.accountKeys.reduce<Parties>(
    (acc, account, i) => {
      const pre = preTokenBalances?.find(b => b.accountIndex === i);
      const post = postTokenBalances?.find(b => b.accountIndex === i);
      if (!pre && !post) return acc;
      if (mint !== undefined && (post?.mint ?? pre?.mint) !== mint) return acc;

      const delta =
        BigInt(post?.uiTokenAmount.amount ?? 0) - BigInt(pre?.uiTokenAmount.amount ?? 0);
      // A closed or fully spent token account is absent from `post`, but `pre` still names its owner.
      const party = post?.owner ?? pre?.owner ?? account.pubkey.toBase58();
      if (delta < 0n) acc.senders.push(party);
      else if (delta > 0n) acc.recipients.push(party);
      return acc;
    },
    { senders: [], recipients: [] },
  );
}

type ParsedIx = { program: string; type: string; info: Record<string, unknown> | undefined };

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
  const frozenOpType = detectTokenAccountState(tx);

  for (const [, change] of tokenChanges) {
    if (change.delta === 0n && !frozenOpType) continue;
    const op = buildTokenOperation(
      address,
      change,
      meta,
      operationIndex,
      tokenParties(tx, change.mint),
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
  // A wallet can hold several token accounts for the same mint, so the balances are summed per
  // mint: moving tokens between two of its own accounts nets to zero instead of reading as an
  // incoming transfer.
  const totals = new Map<string, { change: TokenChange; pre: bigint; post: bigint }>();

  const accumulate = (balance: TokenBalance, side: "pre" | "post") => {
    if (!tokenBalanceMatchesAddress(balance, address, accountKeys)) return;

    const tokenType = resolveTokenType(balance.programId);
    const key = `${balance.mint}-${tokenType}`;
    const entry = totals.get(key) ?? {
      change: { mint: balance.mint, delta: 0n, tokenType, owner: address },
      pre: 0n,
      post: 0n,
    };
    entry[side] += BigInt(balance.uiTokenAmount.amount);
    if (balance.owner) entry.change.owner = balance.owner;
    totals.set(key, entry);
  };

  for (const pre of preTokenBalances) accumulate(pre, "pre");
  for (const post of postTokenBalances) accumulate(post, "post");

  const changes = new Map<string, TokenChange>();
  for (const [key, { change, pre, post }] of totals) {
    changes.set(key, { ...change, delta: post - pre });
  }

  return changes;
}

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

function isBurnTransaction(tx: ParsedTransactionWithMeta): boolean {
  const ixs = getParsedInstructions(tx);
  if (ixs.length !== 1) return false;
  const [ix] = ixs;
  return (
    (ix.program === PARSED_PROGRAMS.SPL_TOKEN || ix.program === PARSED_PROGRAMS.SPL_TOKEN_2022) &&
    (ix.type === "burn" || ix.type === "burnChecked")
  );
}
