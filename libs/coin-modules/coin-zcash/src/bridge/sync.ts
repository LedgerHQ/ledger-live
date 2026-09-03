import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { catchError, defer, from, map, merge, mergeMap, Observable, of, scan, timeout } from "rxjs";
import type {
  AccountShapeInfo,
  GetAccountShapeStream,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { mergeOps, pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId, decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import {
  DerivationMode,
  SYNC_TYPE_SHIELDED,
  SYNC_TYPE_TRANSPARENT,
  SyncConfig,
} from "@ledgerhq/types-live";
import type { OperationType } from "@ledgerhq/types-live";
import type {
  Currency,
  Output as WalletOutput,
  TX,
  Input as WalletInput,
} from "@ledgerhq/wallet-btc/index";
import wallet, { DerivationModes as WalletDerivationModes } from "@ledgerhq/wallet-btc/index";
import { removeReplaced, deduplicateOperations } from "@ledgerhq/wallet-btc/operations";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type {
  BitcoinOutput,
  BtcOperation,
  ZcashAccount,
  ZcashOperationExtra,
} from "../types/bridge";
import type { SignerContext } from "../types/signer";
import type { ShieldedSyncResult, ShieldedTransaction, ZcashPrivateInfo } from "../network/types";
import { ZCASH_SHIELDED_TX_TYPES } from "../network/types";
import { toWalletBtcCurrency } from "../walletBtcCurrency";
import { computeZcashBalance, getTransparentBalance } from "../logic/account/balance";
import { explorerFee, spentOutpoints, txDate } from "../logic/history/transparentTx";
import {
  computeBalanceFromNotes,
  computeIronwoodBalanceFromNotes,
  convertShieldedTransactionsToOperations,
} from "./operations";
import {
  DEFAULT_ZCASH_PRIVATE_INFO,
  getZainoEndpoint,
  ZCASH_AUTO_SYNC_TIMEOUT_MS,
  ZCASH_LOG_TYPE,
} from "../constants";
import { getZCashClient } from "../logic/engineClient";
import { resolveTransactionDetails, type ResolvedTransactions } from "./transaction-details";
import { composeXpub } from "../signer/xpub";
import { releaseConfirmedNullifiers, releaseRetiredReservations } from "./note-reservation";

export { removeReplaced } from "@ledgerhq/wallet-btc/operations";

// ── Transparent (UTXO) sync -- reimplemented against @ledgerhq/wallet-btc ──
//
// This is the "bitcoin path" duplicated inside coin-zcash (owner decision,
// see plan T-WB-03): xpub scanning, explorer/Blockbook fetch, UTXO storage.
// coin-zcash does not import coin-bitcoin's synchronisation.ts -- this is a
// self-contained reimplementation against the same wallet-btc primitives,
// specialised to a single currency (no chain-adapter/perCoinLogic dispatch).

const toWalletDerivationMode = (mode: DerivationMode): WalletDerivationModes => {
  if (isTaprootDerivationMode(mode)) return WalletDerivationModes.TAPROOT;
  if (isNativeSegwitDerivationMode(mode)) return WalletDerivationModes.NATIVE_SEGWIT;
  if (isSegwitDerivationMode(mode)) return WalletDerivationModes.SEGWIT;
  return WalletDerivationModes.LEGACY;
};

const toWalletNetwork = (currencyId: string): "testnet" | "mainnet" =>
  getCryptoCurrencyById(currencyId).isTestnetFor ? "testnet" : "mainnet";

export const fromWalletUtxo = (
  utxo: WalletOutput,
  changeAddresses: Set<string>,
): BitcoinOutput => ({
  hash: utxo.output_hash,
  outputIndex: utxo.output_index,
  blockHeight: utxo.block_height,
  address: utxo.address,
  value: new BigNumber(utxo.value),
  rbf: utxo.rbf,
  isChange: changeAddresses.has(utxo.address),
});

/**
 * Asks the chain what the explorer could not see: the fee actually paid and the
 * shielded addresses the transaction paid.
 *
 * The capability is settled for the whole platform — the React Native client
 * omits it — so it is asked about once here rather than per batch, and no sync
 * builds a request nobody can answer. Without the viewing key the fees are still
 * recoverable; only the payees are not, since they are encrypted to it.
 */
async function recoverTransactionDetails(
  transactions: TX[],
  account: ZcashAccount | undefined,
): Promise<ResolvedTransactions> {
  const client = await getZCashClient(getZainoEndpoint());

  const transactionDetails = client.transactionDetails;
  if (!transactionDetails) return { transactions, payeesByTxId: new Map<string, string[]>() };

  const ufvk = account?.privateInfo?.ufvk ?? undefined;

  return resolveTransactionDetails(
    transactions,
    requests => transactionDetails(requests, ufvk),
    ufvk,
  );
}

/**
 * Replaces the recipients of an operation whose real destination the explorer
 * could not see.
 *
 * A transaction paying only into a shielded pool has no transparent output but
 * its own change, which `mapTxToOperations` lists as the recipient for want of
 * anything better. Once the chain has recovered who was actually paid, that
 * fallback is no longer the best answer available and gives way — while any
 * genuine transparent recipient of the same transaction is kept.
 *
 * Only the outgoing leg is concerned. A transaction can also credit the account
 * it debits, and the recipient of that incoming leg is an address of ours, not
 * whoever we paid in the same breath.
 */
function withRecoveredRecipients(
  op: BtcOperation,
  payeesByTxId: Map<string, string[]> | undefined,
  changeAddresses: Set<string>,
): BtcOperation {
  if (op.type !== "OUT") return op;

  const payees = payeesByTxId?.get(op.hash);
  if (!payees?.length) return op;

  const transparentRecipients = op.recipients.filter(recipient => !changeAddresses.has(recipient));
  return { ...op, recipients: [...transparentRecipients, ...payees] };
}

type AccountInputs = {
  /** Every address the transaction spends from, ours or not. */
  senders: Set<string>;
  accountInputs: WalletInput[];
  /** What the account's own inputs put in, before its change comes back. */
  spent: BigNumber;
};

function collectAccountInputs(tx: TX, accountAddresses: Set<string>): AccountInputs {
  const senders = new Set<string>();
  const accountInputs: WalletInput[] = [];
  let spent = new BigNumber(0);

  for (const input of tx.inputs) {
    if (!input.address) continue;
    senders.add(input.address);
    if (input.value && accountAddresses.has(input.address)) {
      spent = spent.plus(input.value);
      accountInputs.push(input);
    }
  }

  return { senders, accountInputs, spent };
}

/**
 * Minimum nSequence among the account's own inputs -- the conservative
 * RBF/locktime signal. An input that omits it counts as 0xfffffffe, the
 * Bitcoin Core default; no own input at all reads as 0.
 */
function minAccountSequence(accountInputs: WalletInput[]): BigNumber {
  if (accountInputs.length === 0) return new BigNumber(0);
  return new BigNumber(Math.min(...accountInputs.map(input => input.sequence ?? 0xfffffffe)));
}

/** Where a sender's own change sits: the last output of the transaction. */
function changeOutputIndexOf(tx: TX): number {
  return tx.outputs.reduce((highest, output) => Math.max(highest, output.output_index), 0);
}

type OutputContext = {
  fundedByAccount: boolean;
  singleOutput: boolean;
  changeOutputIndex: number;
  spentNothing: boolean;
};

/** An output the explorer could not attribute carries a placeholder address. */
function isAttributed(output: WalletOutput): boolean {
  return !!output.address && !output.address.includes("unknown");
}

/**
 * A foreign address is a payee only when the account funded the transaction,
 * and only among the outputs preceding the change.
 */
function isForeignPayee(output: WalletOutput, context: OutputContext): boolean {
  if (!context.fundedByAccount) return false;
  return context.singleOutput || output.output_index < context.changeOutputIndex;
}

/**
 * One of the account's own addresses is a payee unless it is change -- which
 * still counts when nothing else was paid, or when the account spent nothing
 * and is therefore being paid rather than paying.
 */
function isOwnPayee(
  output: WalletOutput,
  changeAddresses: Set<string>,
  recipientsSoFar: number,
  context: OutputContext,
): boolean {
  if (!changeAddresses.has(output.address)) return true;
  return (
    (recipientsSoFar === 0 && output.output_index >= context.changeOutputIndex) ||
    context.spentNothing
  );
}

type OutputRoles = {
  recipients: string[];
  accountOutputs: WalletOutput[];
};

function assignOutputRoles(
  tx: TX,
  accountAddresses: Set<string>,
  changeAddresses: Set<string>,
  context: OutputContext,
): OutputRoles {
  const recipients: string[] = [];
  const accountOutputs: WalletOutput[] = [];

  for (const output of tx.outputs) {
    if (!isAttributed(output)) continue;

    const isOwn = accountAddresses.has(output.address);
    if (isOwn) accountOutputs.push(output);

    const isPayee = isOwn
      ? isOwnPayee(output, changeAddresses, recipients.length, context)
      : isForeignPayee(output, context);
    if (isPayee) recipients.push(output.address);
  }

  return { recipients, accountOutputs };
}

function sumValues(outputs: WalletOutput[]): BigNumber {
  return outputs.reduce((total, output) => total.plus(output.value), new BigNumber(0));
}

type OperationDraft = {
  tx: TX;
  accountId: string;
  senders: Set<string>;
  recipients: string[];
  transactionSequenceNumber: BigNumber;
};

function buildOperation(
  draft: OperationDraft,
  type: OperationType,
  value: BigNumber,
): BtcOperation {
  const { tx, accountId, senders, recipients, transactionSequenceNumber } = draft;
  return {
    id: encodeOperationId(accountId, tx.id, type),
    hash: tx.id,
    type,
    value,
    fee: explorerFee(tx),
    senders: Array.from(senders),
    recipients,
    blockHeight: tx.block?.height,
    blockHash: tx.block?.hash,
    accountId,
    date: txDate(tx),
    hasFailed: false,
    transactionSequenceNumber,
    extra: { inputs: Array.from(new Set(spentOutpoints(tx))) },
  } as BtcOperation;
}

/**
 * Maps a wallet-btc TX to LL operations. Ported from coin-bitcoin's
 * `logic.ts` `mapTxToOperations`, dropping the multi-currency `perCoinLogic`
 * dispatch (Zcash never overrides `syncReplaceAddress`).
 */
function mapTxToOperations(
  tx: TX,
  accountId: string,
  accountAddresses: Set<string>,
  changeAddresses: Set<string>,
): BtcOperation[] {
  const { senders, accountInputs, spent } = collectAccountInputs(tx, accountAddresses);
  const fundedByAccount = accountInputs.length > 0;

  const { recipients, accountOutputs } = assignOutputRoles(tx, accountAddresses, changeAddresses, {
    fundedByAccount,
    singleOutput: tx.outputs.length === 1,
    changeOutputIndex: changeOutputIndexOf(tx),
    spentNothing: spent.eq(0),
  });

  const draft: OperationDraft = {
    tx,
    accountId,
    senders,
    recipients,
    transactionSequenceNumber: minAccountSequence(accountInputs),
  };

  const operations: BtcOperation[] = [];

  if (fundedByAccount) {
    const change = accountOutputs.filter(output => changeAddresses.has(output.address));
    operations.push(buildOperation(draft, "OUT", spent.minus(sumValues(change))));
  }

  // Change coming back to the account is not income, so a send only credits
  // what it pays to an address of ours that is not change.
  const credited = fundedByAccount
    ? accountOutputs.filter(output => !changeAddresses.has(output.address))
    : accountOutputs;
  if (credited.length > 0) {
    operations.push(buildOperation(draft, "IN", sumValues(credited)));
  }

  return operations;
}

export async function performTransparentSync(
  info: AccountShapeInfo<ZcashAccount>,
  signerContext: SignerContext,
): Promise<Partial<ZcashAccount>> {
  const { currency, index, derivationPath, derivationMode, initialAccount, deviceId } = info;

  const rootPath = derivationPath.split("/", 2).join("/");
  const accountPath = `${rootPath}/${index}'`;

  const paramXpub = initialAccount ? decodeAccountId(initialAccount.id).xpubOrAddress : undefined;

  const xpub = await generateXpubIfNeeded(paramXpub, {
    deviceId,
    currency,
    signerContext,
    accountPath,
  });

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });

  const walletNetwork = toWalletNetwork(currency.id);
  const walletDerivationMode = toWalletDerivationMode(derivationMode);

  const walletAccount =
    initialAccount?.bitcoinResources?.walletAccount ||
    (await wallet.generateAccount(
      {
        xpub,
        path: rootPath,
        index,
        currency: <Currency>currency.id,
        network: walletNetwork,
        derivationMode: walletDerivationMode,
      },
      toWalletBtcCurrency(currency),
    ));

  const oldOperations = (initialAccount?.operations || []) as BtcOperation[];
  const currentBlock = await walletAccount.xpub.explorer.getCurrentBlock();
  const blockHeight = currentBlock?.height || 0;
  await wallet.syncAccount(walletAccount, blockHeight);

  const { txs: transactions } = await wallet.getAccountTransactions(walletAccount);

  const accountAddresses: Set<string> = new Set<string>();
  const accountAddressesWithInfo = await walletAccount.xpub.getXpubAddresses();
  accountAddressesWithInfo.forEach(a => accountAddresses.add(a.address));

  const changeAddresses: Set<string> = new Set<string>();
  const changeAddressesWithInfo = walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
  changeAddressesWithInfo.forEach(a => changeAddresses.add(a.address));

  // The explorer cannot always see enough of a transaction to report its fee or
  // its destination. Recover both before operations are derived, so that senders
  // and recipients agree on the fee.
  //
  // This reaches the network, and it is an enrichment: a sync that already holds
  // the explorer's answer must not be lost because that reach failed.
  let resolved: ResolvedTransactions | undefined;
  try {
    resolved = await recoverTransactionDetails(transactions, initialAccount);
  } catch (error) {
    log(ZCASH_LOG_TYPE, "keeping the explorer's view of the transactions", { error });
  }

  const newOperations = (resolved?.transactions ?? transactions)
    ?.flatMap(tx => mapTxToOperations(tx, accountId, accountAddresses, changeAddresses))
    .map(op => withRecoveredRecipients(op, resolved?.payeesByTxId, changeAddresses));

  const newUniqueOperations = deduplicateOperations(newOperations);
  const _operations = mergeOps(oldOperations, newUniqueOperations);
  const operations = removeReplaced(_operations as BtcOperation[]);
  const balanceOperations = removeReplaced(_operations as BtcOperation[], Date.now(), true);
  const keptOperationHashes = new Set(balanceOperations.map(op => op.hash));
  const removedOperationHashes = new Set(
    (_operations as BtcOperation[])
      .filter(op => !keptOperationHashes.has(op.hash))
      .map(op => op.hash),
  );

  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const filteredRawUtxos = rawUtxos.filter(utxo => {
    if (utxo.block_height !== null) return true;
    if (!utxo.rbf) return true;
    return !removedOperationHashes.has(utxo.output_hash);
  });
  const utxos = filteredRawUtxos.map(utxo => fromWalletUtxo(utxo, changeAddresses));
  const utxoHashes = new Set(utxos.map(u => u.hash));
  const operationsOfUtxos = balanceOperations.filter(op => utxoHashes.has(op.hash));

  const getInputsKey = (op: BtcOperation): string | null => {
    const inputs = op.extra?.inputs;
    if (!Array.isArray(inputs) || inputs.length === 0) return null;
    return [...inputs]
      .sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      })
      .join("|");
  };

  const isBetterCandidate = (candidate: BtcOperation, existing: BtcOperation): boolean => {
    const candidateConfirmed = typeof candidate.blockHeight === "number";
    const existingConfirmed = typeof existing.blockHeight === "number";
    if (candidateConfirmed !== existingConfirmed) return candidateConfirmed;
    const candidateHeight = candidate.blockHeight ?? -1;
    const existingHeight = existing.blockHeight ?? -1;
    if (candidateHeight !== existingHeight) return candidateHeight > existingHeight;
    return new Date(candidate.date).getTime() > new Date(existing.date).getTime();
  };

  const bestOpByInputsKey = new Map<string, BtcOperation>();
  for (const op of operationsOfUtxos) {
    const key = getInputsKey(op);
    if (!key) continue;
    const existing = bestOpByInputsKey.get(key);
    if (!existing || isBetterCandidate(op, existing)) bestOpByInputsKey.set(key, op);
  }

  const finalOperationsOfUtxos = operationsOfUtxos.filter(op => {
    const key = getInputsKey(op);
    if (!key) return true;
    return bestOpByInputsKey.get(key)?.hash === op.hash;
  });

  const finalOperationHashes = new Set(finalOperationsOfUtxos.map(op => op.hash));
  const finalUtxos =
    finalOperationHashes.size > 0
      ? utxos.filter(utxo => finalOperationHashes.has(utxo.hash))
      : utxos;

  const transparentBalance = finalUtxos.reduce(
    (total, utxo) => total.plus(utxo.value),
    new BigNumber(0),
  );

  const balance = computeZcashBalance(transparentBalance, initialAccount?.privateInfo);

  return {
    id: accountId,
    xpub,
    balance,
    // Every pool counted in `balance` is spendable — Zcash Orchard notes as much
    // as transparent UTXOs. Reporting only the transparent balance here would
    // show an account holding nothing but notes as having nothing to spend.
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    freshAddress: walletAccount.xpub.freshAddress,
    freshAddressPath: `${accountPath}/0/${walletAccount.xpub.freshAddressIndex}`,
    blockHeight,
    bitcoinResources: {
      utxos: finalUtxos,
      walletAccount,
    },
  };
}

function createTransparentSyncObservable(
  info: AccountShapeInfo<ZcashAccount>,
  signerContext: SignerContext,
): Observable<Partial<ZcashAccount>> {
  return new Observable<Partial<ZcashAccount>>(subscriber => {
    performTransparentSync(info, signerContext)
      .then(result => {
        subscriber.next(result);
        subscriber.complete();
      })
      .catch(error => subscriber.error(error));
  });
}

type XpubGenerateParameter = {
  deviceId: string | undefined;
  currency: CryptoCurrency;
  signerContext: SignerContext;
  accountPath: string;
};

async function generateXpubIfNeeded(
  providedXpub: string | undefined,
  params: XpubGenerateParameter,
): Promise<string> {
  if (providedXpub) return providedXpub;

  const { deviceId, currency, signerContext, accountPath } = params;
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const { bitcoinLikeInfo } = currency;
  const { XPUBVersion: xpubVersion } = bitcoinLikeInfo as { XPUBVersion: number };

  // coin-zcash always composes the xpub locally (see signer/xpub.ts) -- the
  // DMK Zcash signer kit only exposes getAddress, not a native xpub command.
  const accountPathElements = pathStringToArray(accountPath);
  if (accountPathElements.length === 0) {
    throw new Error(`Cannot derive xpub from empty path "${accountPath}"`);
  }
  const parentPath = accountPath.split("/").slice(0, -1).join("/");
  const childNumber = accountPathElements[accountPathElements.length - 1];

  // Both keys come from a single device session: two concurrent signerContext
  // acquisitions on the same deviceId contend for the transport.
  const { parent, account } = await signerContext(deviceId, async signer => {
    const parent = await signer.getAddress(parentPath, false);
    const account = await signer.getAddress(accountPath, false);
    return { parent, account };
  });

  return composeXpub({
    xpubVersion,
    depth: accountPathElements.length,
    childNumber,
    parentPublicKeyHex: parent.publicKey,
    accountPublicKeyHex: account.publicKey,
    accountChainCodeHex: account.chainCode,
  });
}

// ── Shielded sync ────────────────────────────────────────────────────────

const ZCASH_NATIVE_CHUNK_SIZE = 5_000;

async function resolveStartBlockHeight(
  lastProcessedBlock: number | null | undefined,
  birthday: string | null | undefined,
  findBlockHeight: (timestamp: number) => Promise<number>,
): Promise<number> {
  if (lastProcessedBlock !== null && lastProcessedBlock !== undefined) {
    return lastProcessedBlock + 1;
  }
  if (birthday) {
    const ts = Math.floor(new Date(birthday).getTime() / 1000);
    return findBlockHeight(ts);
  }
  return 0;
}

export const zcashSyncShielded = (
  acc: AccountShapeInfo<ZcashAccount>,
  _syncConfig: SyncConfig,
): Observable<ShieldedSyncResult> =>
  defer(() => {
    const viewingKey = acc.initialAccount?.privateInfo?.ufvk;
    if (!viewingKey) {
      throw new Error("Missing unified full viewing key (ufvk) for ZCash shielded sync");
    }
    const { lastProcessedBlock, birthday, transactions } = acc.initialAccount?.privateInfo ?? {};

    // The NAPI uses a unified knownNullifiers field for all pools.
    const knownNullifiers: string[] = [
      ...new Set([
        ...(transactions ?? []).flatMap(tx =>
          (tx.decryptedData?.orchard_outputs ?? [])
            .filter(
              n =>
                n.isSpent !== true &&
                n.nullifier !== undefined &&
                (n.transfer_type === "incoming" || n.transfer_type === "internal"),
            )
            .map(n => n.nullifier!),
        ),
        ...(transactions ?? []).flatMap(tx =>
          (tx.decryptedData?.ironwood_outputs ?? [])
            .filter(
              n =>
                n.isSpent !== true &&
                n.nullifier !== undefined &&
                (n.transfer_type === "incoming" || n.transfer_type === "internal"),
            )
            .map(n => n.nullifier!),
        ),
      ]),
    ];

    return from(getZCashClient(getZainoEndpoint())).pipe(
      mergeMap(client => {
        return from(
          resolveStartBlockHeight(lastProcessedBlock, birthday, ts => client.findBlockHeight(ts)),
        ).pipe(
          mergeMap(startBlockHeight =>
            client.syncShielded({
              startBlockHeight,
              viewingKey,
              maxBatchSize: ZCASH_NATIVE_CHUNK_SIZE,
              ...(knownNullifiers.length > 0 && { knownNullifiers }),
            }),
          ),
        );
      }),
    );
  });

type ShieldedScanAccumulated = {
  processedOperations: ShieldedTransaction[];
  accountUpdate: Partial<ZcashAccount>;
};

/**
 * Resolve the scan cursor to persist, given what the chunk reported.
 *
 * A chunk that scanned nothing — an account already at the chain tip, the
 * steady state of any synced account — carries no `lastProcessedBlock`. Writing
 * that absence straight back as `null` clears the cursor, and the next sync
 * restarts from the account birthday and rescans the entire shielded history.
 * The cursor only ever moves forward.
 */
function advanceScanCursor(
  previous: number | null | undefined,
  fromChunk: number | undefined,
): number | null {
  if (fromChunk === undefined) return previous ?? null;
  if (previous === null || previous === undefined) return fromChunk;
  return Math.max(previous, fromChunk);
}

/**
 * Return `tx` with its orchard/ironwood notes marked spent when their nullifier
 * appears in `spentSet`. Returns the original reference untouched when nothing
 * matches, preserving immutability of the accumulated state.
 */
function markSpentNotes(tx: ShieldedTransaction, spentSet: Set<string>): ShieldedTransaction {
  const orchardOutputs = tx.decryptedData?.orchard_outputs;
  const ironwoodOutputs = tx.decryptedData?.ironwood_outputs;
  const orchardHit = orchardOutputs?.some(n => n.nullifier && spentSet.has(n.nullifier));
  const ironwoodHit = ironwoodOutputs?.some(n => n.nullifier && spentSet.has(n.nullifier));
  if (!orchardHit && !ironwoodHit) return tx;
  return {
    ...tx,
    decryptedData: {
      orchard_outputs: (orchardOutputs ?? []).map(n =>
        n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
      ),
      sapling_outputs: tx.decryptedData?.sapling_outputs ?? [],
      ...(ironwoodOutputs && {
        ironwood_outputs: ironwoodOutputs.map(n =>
          n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
        ),
      }),
    },
  };
}

/** How far the scan got, as persisted on the account. */
function scanProgress(
  result: ShieldedSyncResult,
): Pick<ZcashPrivateInfo, "syncState" | "progress"> {
  const totalBlocks = result.processedBlocks + result.remainingBlocks;
  return {
    syncState: result.remainingBlocks > 0 ? "running" : "complete",
    progress: totalBlocks > 0 ? Math.round((result.processedBlocks / totalBlocks) * 100) : 100,
  };
}

/**
 * Fold a chunk that carries no transaction the account does not already hold.
 *
 * Only the scan cursor and the spent flags can move here: a note already known
 * may have been spent elsewhere, which the chunk reports through its
 * nullifiers. Operations are left untouched.
 */
function reduceUnchangedShieldedChunk(
  accumulated: ShieldedScanAccumulated,
  result: ShieldedSyncResult,
  context: {
    existingPrivateInfo: ZcashPrivateInfo;
    transparentBalance: BigNumber;
    lastProcessedBlock: number | null;
    accountId: string;
  },
): ShieldedScanAccumulated {
  const { existingPrivateInfo, transparentBalance, lastProcessedBlock, accountId } = context;
  // The NAPI uses a unified spentKnownNullifiers list for all pools.
  const spentNfs = result.spentKnownNullifiers ?? [];
  const hasNewlySpentNotes = spentNfs.length > 0;
  const spentSet = new Set(spentNfs);

  const updatedTransactions = hasNewlySpentNotes
    ? existingPrivateInfo.transactions.map(tx => markSpentNotes(tx, spentSet))
    : existingPrivateInfo.transactions;
  const orchardBalance = hasNewlySpentNotes
    ? computeBalanceFromNotes(updatedTransactions)
    : existingPrivateInfo.orchardBalance;
  const ironwoodBalance = hasNewlySpentNotes
    ? computeIronwoodBalanceFromNotes(updatedTransactions)
    : existingPrivateInfo.ironwoodBalance;

  const balance = computeZcashBalance(transparentBalance, {
    orchardBalance,
    saplingBalance: existingPrivateInfo.saplingBalance,
    ironwoodBalance,
  });

  releaseConfirmedNullifiers(accountId, spentNfs);

  return {
    ...accumulated,
    accountUpdate: {
      ...accumulated.accountUpdate,
      balance,
      spendableBalance: balance,
      blockHeight: lastProcessedBlock ?? accumulated.accountUpdate.blockHeight ?? 0,
      privateInfo: {
        ...existingPrivateInfo,
        ...scanProgress(result),
        lastProcessedBlock,
        lastSyncTimestamp: Date.now(),
        transactions: updatedTransactions,
        orchardBalance,
        ironwoodBalance,
        lastSyncError: null,
      },
    },
  };
}

export function reduceShieldedSyncResult(
  accumulated: ShieldedScanAccumulated,
  result: ShieldedSyncResult,
  info: AccountShapeInfo<ZcashAccount>,
  accountId: string,
): ShieldedScanAccumulated {
  const existingPrivateInfo =
    accumulated.accountUpdate.privateInfo ||
    info.initialAccount?.privateInfo ||
    DEFAULT_ZCASH_PRIVATE_INFO;
  const processedIds = new Set(accumulated.processedOperations.map(tx => tx.id));
  const newTransactions = result.transactions.filter(tx => !processedIds.has(tx.id));

  const transparentBalance = getTransparentBalance(info.initialAccount?.bitcoinResources?.utxos);

  const lastProcessedBlock = advanceScanCursor(
    existingPrivateInfo.lastProcessedBlock,
    result.lastProcessedBlock,
  );

  if (newTransactions.length === 0) {
    return reduceUnchangedShieldedChunk(accumulated, result, {
      existingPrivateInfo,
      transparentBalance,
      lastProcessedBlock,
      accountId,
    });
  }

  const newOperations = convertShieldedTransactionsToOperations(newTransactions, accountId);
  const currentOperations = (accumulated.accountUpdate.operations || []) as BtcOperation[];
  const mergedOperations = mergeOps(currentOperations, newOperations);
  const operations = removeReplaced(mergedOperations as BtcOperation[]);

  const newIds = new Set(newTransactions.map(tx => tx.id));
  const allShieldedTx: ShieldedTransaction[] = [
    ...(accumulated.accountUpdate.privateInfo?.transactions ?? []).filter(tx => !newIds.has(tx.id)),
    ...newTransactions,
  ];

  // The NAPI uses a unified spentKnownNullifiers list for all pools.
  const spentNfs = result.spentKnownNullifiers ?? [];
  if (spentNfs.length > 0) {
    const spentSet = new Set(spentNfs);
    // markSpentNotes returns the same reference when nothing matches.
    for (let i = 0; i < allShieldedTx.length; i++) {
      allShieldedTx[i] = markSpentNotes(allShieldedTx[i], spentSet);
    }
  }

  const orchardBalance = computeBalanceFromNotes(allShieldedTx);
  const ironwoodBalance = computeIronwoodBalanceFromNotes(allShieldedTx);
  const saplingBalance = accumulated.accountUpdate.privateInfo?.saplingBalance ?? new BigNumber(0);

  const privateInfo: ZcashPrivateInfo = {
    saplingBalance,
    orchardBalance,
    ironwoodBalance,
    ...scanProgress(result),
    estimatedTimeRemaining: existingPrivateInfo.estimatedTimeRemaining ?? { hours: 0, minutes: 0 },
    ufvk: existingPrivateInfo?.ufvk ?? null,
    birthday: existingPrivateInfo?.birthday ?? null,
    shieldedAddress: existingPrivateInfo?.shieldedAddress ?? null,
    lastSyncTimestamp: Date.now(),
    lastProcessedBlock,
    transactions: allShieldedTx,
    lastSyncError: null,
  };

  const balance = computeZcashBalance(transparentBalance, {
    orchardBalance,
    saplingBalance,
    ironwoodBalance,
  });

  log(
    "zcash/reduceShieldedSyncResult",
    `Processed ${newOperations.length} new shielded operations`,
    {
      accountId,
      totalOperations: operations.length,
    },
  );

  const missingOpsCount = Math.max(
    0,
    (info.initialAccount?.operationsCount ?? 0) - (info.initialAccount?.operations?.length ?? 0),
  );

  releaseConfirmedNullifiers(accountId, spentNfs);

  return {
    processedOperations: [...result.transactions],
    accountUpdate: {
      ...accumulated.accountUpdate,
      balance,
      spendableBalance: balance,
      operations,
      operationsCount: missingOpsCount + operations.length,
      blockHeight: lastProcessedBlock ?? info.initialAccount?.blockHeight ?? 0,
      privateInfo,
    },
  };
}

function createShieldedSyncObservable(
  info: AccountShapeInfo<ZcashAccount>,
  shieldedSyncRaw: Observable<ShieldedSyncResult>,
): Observable<Partial<ZcashAccount>> {
  const accountId =
    info.initialAccount?.id ??
    encodeAccountId({
      type: "js",
      version: "2",
      currencyId: info.currency.id,
      xpubOrAddress: info.initialAccount?.xpub || "",
      derivationMode: info.derivationMode,
    });

  const initialAccountUpdate: ShieldedScanAccumulated["accountUpdate"] = {
    operations: (info.initialAccount?.operations || []) as BtcOperation[],
    ...(info.initialAccount?.blockHeight !== undefined && {
      blockHeight: info.initialAccount.blockHeight,
    }),
    ...(info.initialAccount?.privateInfo && {
      privateInfo: { ...info.initialAccount.privateInfo, syncState: "running" as const },
    }),
  };

  const initialAccumulated: ShieldedScanAccumulated = {
    processedOperations: [],
    accountUpdate: initialAccountUpdate,
  };

  return shieldedSyncRaw.pipe(
    scan(
      (accumulated, result) => reduceShieldedSyncResult(accumulated, result, info, accountId),
      initialAccumulated,
    ),
    map(accumulated => accumulated.accountUpdate),
  );
}

/**
 * Build the extra shielded sync observable for Zcash accounts.
 * Returns `undefined` if the account is not eligible for shielded sync.
 */
export function buildExtraSyncObservable(
  info: AccountShapeInfo<ZcashAccount>,
  syncConfig: SyncConfig,
): Observable<Partial<ZcashAccount>> | undefined {
  const syncType = syncConfig.syncType ?? 0;
  const includesShielded = (syncType & SYNC_TYPE_SHIELDED) !== 0;
  if (!includesShielded) return undefined;

  const zcashInitialAccount = info.initialAccount;

  const ufvkIsPresent =
    !!zcashInitialAccount &&
    !!zcashInitialAccount.privateInfo?.ufvk &&
    zcashInitialAccount.privateInfo.ufvk.length > 0;

  // "stopped" is overloaded: the leg sets it on its own after an error/timeout (see the
  // catchError below, which also sets lastSyncError) so the next automatic tick can retry,
  // but useZcashShieldedSync's manual stop sets the same value to mean "leave it alone until
  // the user restarts it" -- without checking lastSyncError, the automatic wallet sync (which
  // always requests the shielded leg for zcash, see BridgeSync.tsx) would rebuild it on its
  // next tick and flip syncState back to "running", making a manual stop never stick.
  const syncStateIsEnabled =
    !!zcashInitialAccount &&
    (zcashInitialAccount.privateInfo?.syncState === "ready" ||
      zcashInitialAccount.privateInfo?.syncState === "running" ||
      (zcashInitialAccount.privateInfo?.syncState === "stopped" &&
        !!zcashInitialAccount.privateInfo?.lastSyncError) ||
      zcashInitialAccount.privateInfo?.syncState === "outdated" ||
      zcashInitialAccount.privateInfo?.syncState === "complete");

  if (!ufvkIsPresent || !syncStateIsEnabled) return undefined;

  const shieldedSyncRaw = zcashSyncShielded(info, syncConfig);
  return createShieldedSyncObservable(info, shieldedSyncRaw).pipe(
    timeout(ZCASH_AUTO_SYNC_TIMEOUT_MS),
    catchError(error => {
      log(ZCASH_LOG_TYPE, `shielded sync failed/timed out: ${String(error)}`);
      // This bridge is registered with shouldMergeOps: false (bridge/index.ts),
      // so whatever `operations` this emission carries REPLACES the account's
      // operations wholesale -- omitting it here would wipe the account's
      // entire transaction history down to `[]` on every timeout/error. Carry
      // the pre-sync operations forward unchanged, the same way a successful
      // emission always seeds from `info.initialAccount?.operations` too.
      return of<Partial<ZcashAccount>>({
        operations: (zcashInitialAccount?.operations ?? []) as BtcOperation[],
        privateInfo: {
          ...(zcashInitialAccount?.privateInfo ?? DEFAULT_ZCASH_PRIVATE_INFO),
          syncState: "stopped",
          lastSyncError: String(error),
        },
      });
    }),
  );
}

// ── Merged getAccountShape (transparent + shielded) ─────────────────────
//
// coin-zcash owns both halves itself (no coin-bitcoin fallback): every sync
// always runs the transparent leg, and adds the shielded leg when eligible.

const isShieldedOperation = (op: BtcOperation): boolean =>
  (ZCASH_SHIELDED_TX_TYPES as readonly string[]).includes(op.type);

/**
 * Both legs anchor to the same pre-tick `initialAccount.operations` snapshot and each
 * re-emits it merged with only its own new finds (see `performTransparentSync` and
 * `reduceShieldedSyncResult`), so every emission from either leg carries a mix of fresh
 * data for its own domain plus a stale, frozen-at-tick-start copy of the other's. This
 * is where they're combined, tracking each leg's latest domain separately so a stale
 * copy from one leg's emission can never wholesale-replace the other leg's same-tick
 * progress once it reaches `makeSync`'s `shouldMergeOps: false` merge (bridge/index.ts).
 */
export function reconcileLegOperations(
  latest: { transparent: BtcOperation[]; shielded: BtcOperation[] },
  leg: "transparent" | "shielded",
  result: Partial<ZcashAccount>,
): Partial<ZcashAccount> {
  if (!result.operations) return result;

  latest[leg] = (result.operations as BtcOperation[]).filter(op =>
    leg === "shielded" ? isShieldedOperation(op) : !isShieldedOperation(op),
  );

  // A t→z shield or z→t deshield is one transaction that both legs sync
  // independently and each records as its own operation for the same `hash`
  // (different `type`): the transparent leg's IN/OUT already carries the full
  // value moved (see `mapTxToOperations`), so the shielded leg's record of that
  // same hash is a duplicate, not a second real event -- dropped here (the only
  // place both legs' buckets are available together) rather than shown twice in
  // `account.operations`. The shielded record is the only one carrying a memo
  // (`convertShieldedTransactionsToOperations`; the transparent leg's `extra`
  // only ever has UTXO inputs), so that memo is copied onto the surviving
  // transparent operation before the shielded one is dropped -- otherwise a
  // memo attached to a shielding/de-shielding send would silently vanish.
  const shieldedByHash = new Map(latest.shielded.map(op => [op.hash, op]));
  const transparent = latest.transparent.map(op => {
    const twinMemo = (shieldedByHash.get(op.hash)?.extra as ZcashOperationExtra | undefined)?.memo;
    if (!twinMemo || (op.extra as ZcashOperationExtra | undefined)?.memo) return op;
    return { ...op, extra: { ...(op.extra as ZcashOperationExtra | undefined), memo: twinMemo } };
  });
  const transparentHashes = new Set(latest.transparent.map(op => op.hash));
  const shielded = latest.shielded.filter(op => !transparentHashes.has(op.hash));

  return {
    ...result,
    operations: [...transparent, ...shielded].sort(
      (a, b) => b.date.valueOf() - a.date.valueOf(),
    ) as BtcOperation[],
  };
}

export function buildSyncObservables(
  info: AccountShapeInfo<ZcashAccount>,
  syncConfig: SyncConfig,
  signerContext: SignerContext,
): { syncs: Observable<Partial<ZcashAccount>>[]; syncType: number } {
  const syncType = syncConfig.syncType ?? SYNC_TYPE_TRANSPARENT;
  const syncs: Observable<Partial<ZcashAccount>>[] = [];

  const initialOps = (info.initialAccount?.operations || []) as BtcOperation[];
  const latest = {
    transparent: initialOps.filter(op => !isShieldedOperation(op)),
    shielded: initialOps.filter(isShieldedOperation),
  };

  if (syncType & SYNC_TYPE_TRANSPARENT) {
    syncs.push(
      createTransparentSyncObservable(info, signerContext).pipe(
        map(result => reconcileLegOperations(latest, "transparent", result)),
      ),
    );
  }

  const extraSync = buildExtraSyncObservable(info, syncConfig);
  if (extraSync) {
    syncs.push(extraSync.pipe(map(result => reconcileLegOperations(latest, "shielded", result))));
  }

  return { syncs, syncType };
}

export function makeGetAccountShape(
  signerContext: SignerContext,
): GetAccountShapeStream<ZcashAccount> {
  return (info: AccountShapeInfo<ZcashAccount>, syncConfig: SyncConfig) =>
    new Observable(o => {
      const { syncs } = buildSyncObservables(info, syncConfig, signerContext);

      if (syncs.length === 0) {
        o.complete();
        return;
      }

      const sub = merge(...syncs).subscribe({
        next: result => o.next(result),
        complete: () => o.complete(),
        error: error => o.error(error),
      });
      return () => sub.unsubscribe();
    });
}

/**
 * Reconcile optimistic operations with their now-confirmed counterparts.
 *
 * `shouldRetainPendingOperation` matches on operation id, and an id embeds the
 * operation type: the optimistic operation created at signing time is an `OUT`,
 * while the confirmed one a sync produces carries the shielded type the scan
 * derived. The two never match, so the pending entry survives next to its own
 * confirmed counterpart until the optimistic retention window expires. The
 * transaction hash is what actually identifies them.
 *
 * Before dropping the optimistic operation, take from it the address the user
 * actually entered. It is the most faithful answer available — a destination
 * recovered from the transaction can only be the receiver found there, which for
 * a unified address bundling several receivers is the same destination written
 * differently.
 */
function reconcileConfirmedPendingOperations(account: ZcashAccount): ZcashAccount {
  if (account.pendingOperations.length === 0) return account;

  const pendingByHash = new Map(account.pendingOperations.map(op => [op.hash, op]));
  const operations = account.operations.map(op => {
    const optimistic = pendingByHash.get(op.hash);
    // An incoming operation shares its hash with the send that produced it, but
    // it is not the operation that paid the entered address.
    if (!optimistic || op.type.endsWith("IN")) return op;
    const patch: Partial<BtcOperation> = {};
    if (optimistic.recipients.length) patch.recipients = optimistic.recipients;
    const optimisticMemo = (optimistic.extra as ZcashOperationExtra | undefined)?.memo;
    if (optimisticMemo && !(op.extra as ZcashOperationExtra | undefined)?.memo) {
      const newExtra: ZcashOperationExtra = {
        ...(op.extra as ZcashOperationExtra | undefined),
        memo: optimisticMemo,
      };
      patch.extra = newExtra;
    }
    return Object.keys(patch).length ? { ...op, ...patch } : op;
  });

  // Only the optimistic operations that now have a confirmed counterpart are
  // resolved; the rest are still in flight.
  const confirmedHashes = new Set(account.operations.map(op => op.hash));
  const pendingOperations = account.pendingOperations.filter(op => !confirmedHashes.has(op.hash));

  return { ...account, operations, pendingOperations };
}

/**
 * Note reservations hang off the same lifecycle: the notes a shielded send spends
 * stay reserved until the operation spending them is retired, matched on the very
 * hashes `reconcileConfirmedPendingOperations` resolves the optimistic operation
 * by.
 */
export const postSync = (_initial: ZcashAccount, synced: ZcashAccount): ZcashAccount => {
  releaseRetiredReservations(synced.id, new Set(synced.operations.map(op => op.hash)));
  return reconcileConfirmedPendingOperations(synced);
};
