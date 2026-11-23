import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import { isCantonAccountEmpty } from "../helpers";
import { getInstrumentBalances } from "./instrumentBalances";
import { isInstrument, type NativeInstrument } from "../logic/asset";
import { resumeOffset } from "../logic/listOperations";
import { determineOperationType } from "../logic/operationType";
import type { AssetView } from "../types/gateway";
import {
  getCalTokensCached,
  getEnabledInstrumentsCached,
  getKey,
  getLedgerEnd,
  getNativeInstrument,
  getOperations,
  getPartyById,
  getPendingTransferProposals,
  SEPARATOR,
  type OperationInfo,
} from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner, type ScanCheckpoint } from "../types";
import { buildSubAccounts, mergeOperations } from "./buildSubAccounts";
import { getCurrencyContext } from "./context";
import { isAccountOnboarded } from "./onboard";

type ValidOperationInfo = OperationInfo & {
  asset: { type: "native" | "token"; instrumentId: string; instrumentAdmin: string };
  transfers: Array<{
    value: string;
    details?: { operationType?: string; metadata?: { reason?: string } };
  }>;
  senders: string[];
  recipients: string[];
};

function isValidOperation(txInfo: OperationInfo): txInfo is ValidOperationInfo {
  return (
    txInfo.asset !== undefined &&
    (txInfo.asset.type === "native" || txInfo.asset.type === "token") &&
    typeof txInfo.asset.instrumentId === "string" &&
    typeof txInfo.asset.instrumentAdmin === "string" &&
    txInfo.transfers !== undefined &&
    txInfo.transfers.length > 0 &&
    txInfo.senders !== undefined &&
    txInfo.recipients !== undefined
  );
}

/**
 * Bumped whenever stored operations go stale, or rows dropped so far (see `scanCheckpoint`) get an
 * operation, so that every account syncs again from scratch:
 * 1: fees in their own asset (ADR-068) — a token operation no longer carries the CC fee, which the
 * main account charges.
 */
export const SYNC_HASH = "1";

const GATEWAY_PAGE_SIZE = 1_000;

/** Operation types whose fee the account paid, so their value includes it. */
const CHARGED_TYPES: ReadonlySet<OperationType> = new Set(["OUT", "FEES"]);

/**
 * Operation types whose fee the account pays when it sends them. Creating a transfer proposal burns
 * its fee although the proposal moves no value.
 */
const PAYING_TYPES: ReadonlySet<OperationType> = new Set([...CHARGED_TYPES, "TRANSFER_PROPOSAL"]);

type Instrument = { instrumentId: string; instrumentAdmin: string };

const instrumentOf = (asset: AssetView | undefined): Instrument | undefined =>
  asset && "instrumentId" in asset
    ? { instrumentId: asset.instrumentId, instrumentAdmin: asset.instrumentAdmin }
    : undefined;

// Exact: the gateway gives every Amulet asset, of a row or of a fee, the same placeholder admin.
const isSameInstrument = (a: Instrument, b: Instrument): boolean =>
  a.instrumentId === b.instrumentId && a.instrumentAdmin === b.instrumentAdmin;

/** One operation of an asset in a transaction: the gateway gives a row per receiver. */
type OperationGroup = {
  row: ValidOperationInfo;
  instrument: Instrument;
  type: OperationType;
  transferValue: BigNumber;
  fee: BigNumber;
  senders: Set<string>;
  recipients: Set<string>;
  memos: Set<string>;
};

const groupKey = (hash: string, { instrumentId, instrumentAdmin }: Instrument, type: string) =>
  [hash, instrumentId, instrumentAdmin, type].join("\n");

/**
 * A row's operation type and fee. `shownFee` joins the row's operation: its value too when the
 * account paid it on an OUT or FEES row, and otherwise as a fee shown, not charged. A fee the
 * account paid in another asset or on another type goes to `separateFeeAsset`. `paidFeeAsset` is
 * the asset of any fee the account paid.
 */
function classifyRow(row: ValidOperationInfo, partyId: string) {
  const [{ value: transferValue, details }] = row.transfers;
  const type = determineOperationType(
    details?.operationType,
    row.type,
    transferValue,
    row.senders,
    partyId,
  );
  const instrument = {
    instrumentId: row.asset.instrumentId,
    instrumentAdmin: row.asset.instrumentAdmin,
  };
  const feeInstrument = instrumentOf(row.fee.asset);
  const fee = new BigNumber(row.fee.value);
  const isOwnFee = feeInstrument !== undefined && isSameInstrument(feeInstrument, instrument);
  const isPaid = PAYING_TYPES.has(type) && row.senders.includes(partyId) && fee.gt(0);
  const joinsValue = isPaid && isOwnFee && CHARGED_TYPES.has(type);
  const isSeparate = isPaid && !joinsValue;
  return {
    type,
    instrument,
    transferValue,
    memo: details?.metadata?.reason,
    fee,
    shownFee: isOwnFee && !isSeparate ? fee : new BigNumber(0),
    separateFeeAsset: isSeparate ? feeInstrument : undefined,
    paidFeeAsset: isPaid ? feeInstrument : undefined,
  };
}

/**
 * Charges a fee paid outside its row on the transaction's OUT or FEES operation in the fee's
 * asset, or else on a FEES operation of its own.
 */
function chargeSeparateFee(
  groups: Map<string, OperationGroup>,
  { row, instrument, fee }: { row: ValidOperationInfo; instrument: Instrument; fee: BigNumber },
  partyId: string,
): void {
  const payer = [...CHARGED_TYPES]
    .map(type => groups.get(groupKey(row.transaction_hash, instrument, type)))
    .find(group => group !== undefined);
  if (payer) {
    payer.fee = payer.fee.plus(fee);
    return;
  }
  groups.set(groupKey(row.transaction_hash, instrument, "FEES"), {
    row,
    instrument,
    type: "FEES",
    transferValue: new BigNumber(0),
    fee,
    senders: new Set([partyId]),
    recipients: new Set(),
    memos: new Set(),
  });
}

/**
 * Charges each fee in its own asset (ADR-068). A row's fee is that of its own transfer, and the
 * gateway sets it on the sender's row only. A fee in the row's asset joins the value of an OUT or
 * FEES row. Any other fee the account paid, in practice the CC fee of a token transfer or of a
 * transfer proposal, joins the transaction's OUT or FEES operation in that asset, or a FEES
 * operation of its own.
 *
 * A transaction of a pending transfer proposal yields its paid fees only, as FEES operations: the
 * offer list shows the proposal itself until it settles.
 */
function toOperations(
  rows: ValidOperationInfo[],
  accountId: string,
  partyId: string,
  pendingHashes: ReadonlySet<string>,
): Operation[] {
  const groups = new Map<string, OperationGroup>();
  const separateFees = new Map<
    string,
    { row: ValidOperationInfo; instrument: Instrument; fee: BigNumber }
  >();
  const addSeparateFee = (row: ValidOperationInfo, instrument: Instrument, fee: BigNumber) => {
    const key = groupKey(row.transaction_hash, instrument, "");
    const separate = separateFees.get(key) ?? { row, instrument, fee: new BigNumber(0) };
    separate.fee = separate.fee.plus(fee);
    separateFees.set(key, separate);
  };

  for (const row of rows) {
    const { type, instrument, transferValue, memo, fee, shownFee, separateFeeAsset, paidFeeAsset } =
      classifyRow(row, partyId);

    if (pendingHashes.has(row.transaction_hash)) {
      if (paidFeeAsset) addSeparateFee(row, paidFeeAsset, fee);
      continue;
    }

    const key = groupKey(row.transaction_hash, instrument, type);
    const group = groups.get(key) ?? {
      row,
      instrument,
      type,
      transferValue: new BigNumber(0),
      fee: new BigNumber(0),
      senders: new Set<string>(),
      recipients: new Set<string>(),
      memos: new Set<string>(),
    };
    group.transferValue = group.transferValue.plus(transferValue);
    if (memo !== undefined) group.memos.add(memo);
    group.fee = group.fee.plus(shownFee);
    if (separateFeeAsset) addSeparateFee(row, separateFeeAsset, fee);
    row.senders.forEach(sender => group.senders.add(sender));
    row.recipients.forEach(recipient => group.recipients.add(recipient));
    groups.set(key, group);
  }

  for (const separate of separateFees.values()) chargeSeparateFee(groups, separate, partyId);

  return [...groups.values()].map(
    ({ row, instrument, type, transferValue, fee, senders, recipients, memos }) => ({
      id: encodeOperationId(accountId, row.transaction_hash, type),
      hash: row.transaction_hash,
      accountId,
      type,
      value: CHARGED_TYPES.has(type) ? transferValue.plus(fee) : transferValue,
      fee,
      blockHash: row.block.hash ?? "",
      blockHeight: row.block.height,
      senders: [...senders],
      recipients: [...recipients],
      date: new Date(row.transaction_timestamp),
      transactionSequenceNumber: new BigNumber(row.block.height),
      extra: {
        uid: row.uid,
        // Rows that disagree leave no memo rather than one that holds for some of them only.
        memo: memos.size === 1 ? [...memos][0] : undefined,
        ...instrument,
      },
    }),
  );
}

/** Every row from `start` to `end`, the ledger end read before the walk so it does not chase new activity. */
async function readOperations(
  config: CantonCoinConfig,
  partyId: string,
  start: number,
  end: number,
): Promise<OperationInfo[]> {
  const rows: OperationInfo[] = [];
  if (start > end) return rows;
  let cursor: number | undefined;
  for (;;) {
    const { operations, next } = await getOperations(config, partyId, {
      minOffset: start,
      maxOffset: end,
      cursor,
      limit: GATEWAY_PAGE_SIZE,
    });
    rows.push(...operations);
    if (next === undefined || next < 0) return rows;
    const resume = resumeOffset(cursor ?? start, operations, next);
    if (resume > end) return rows;
    cursor = resume;
  }
}

/**
 * The rows from the checkpoint's transaction, below every transaction to read again. Offsets are
 * local to a node and the gateway fails over between nodes, so when the checkpoint's transaction is
 * not where it was read, or without a checkpoint, the rows from offset 0.
 */
async function readHistory(
  config: CantonCoinConfig,
  partyId: string,
  checkpoint: ScanCheckpoint | undefined,
  end: number,
): Promise<{ rows: OperationInfo[]; isFullRead: boolean }> {
  if (checkpoint) {
    const rows = await readOperations(config, partyId, checkpoint.height, end);
    const isCheckpointRead = rows.some(
      ({ transaction_hash, block }) =>
        transaction_hash === checkpoint.hash && block.height === checkpoint.height,
    );
    if (isCheckpointRead) return { rows, isFullRead: false };
  }
  return { rows: await readOperations(config, partyId, 0, end), isFullRead: true };
}

/** The fees of the operations, by instrument. */
const feesByInstrument = (operations: Operation[]): Map<string, BigNumber> => {
  const fees = new Map<string, BigNumber>();
  for (const { fee, extra } of operations) {
    const { instrumentId, instrumentAdmin } = extra as Instrument;
    const key = getKey(instrumentId, instrumentAdmin);
    fees.set(key, (fees.get(key) ?? new BigNumber(0)).plus(fee));
  }
  return fees;
};

const ofHash = (operations: Operation[], hash: string) => operations.filter(op => op.hash === hash);

/** Whether the operations read again charge at least the fees stored, in each instrument. */
const coversFees = (read: Operation[], stored: Operation[]): boolean => {
  const readFees = feesByInstrument(read);
  return [...feesByInstrument(stored)].every(([key, fee]) =>
    (readFees.get(key) ?? new BigNumber(0)).gte(fee),
  );
};

const withoutReplayed = (
  subAccount: TokenAccount,
  isReplayed: (op: Operation) => boolean,
): TokenAccount => {
  if (!subAccount.operations.some(isReplayed)) return subAccount;
  const operations = subAccount.operations.filter(op => !isReplayed(op));
  return { ...subAccount, operations, operationsCount: operations.length };
};

/** Whether the token gets a sub-account: listed in the CAL with an admin, and enabled. */
const isTokenEnabled = (
  token: TokenCurrency,
  calTokens: Map<string, string>,
  enabledInstruments: ReadonlySet<string>,
): boolean => {
  const instrumentId = calTokens.get(token.id);
  const adminId = token.contractAddress;
  return !!instrumentId && !!adminId && enabledInstruments.has(getKey(instrumentId, adminId));
};

export function filterDisabledTokenAccounts(
  subAccounts: TokenAccount[],
  calTokens: Map<string, string>,
  enabledInstruments: ReadonlySet<string>,
): TokenAccount[] {
  return subAccounts.filter(({ token }) => isTokenEnabled(token, calTokens, enabledInstruments));
}

// So a node info outage doesn't fail every sync of an account an earlier sync classified.
async function getNativeInstrumentOrSaved(
  context: CantonContext,
  config: CantonCoinConfig,
  savedAdmin: string | undefined,
): Promise<NativeInstrument> {
  try {
    return await getNativeInstrument(config);
  } catch (error) {
    if (!savedAdmin) throw error;
    context.logger("canton/sync", "DSO party read failed, using the saved one", { error });
    return { instrumentId: config.nativeInstrumentId, instrumentAdmin: savedAdmin };
  }
}

export function makeGetAccountShape(
  signerContext: SignerContext<CantonSigner>,
  context: CantonContext,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, currency, derivationMode, derivationPath, initialAccount } = info;
    const config = await context.config(currency.id);

    let isOnboarded = initialAccount?.cantonResources?.isOnboarded ?? false;
    let xpubOrAddress = (initialAccount?.xpub || initialAccount?.cantonResources?.xpub) ?? "";
    let publicKey: string | undefined = initialAccount?.cantonResources?.publicKey;

    if (!xpubOrAddress && !publicKey) {
      const getAddress = resolver(signerContext);
      const addressResult = await getAddress(info.deviceId ?? "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });
      publicKey = addressResult.publicKey;

      const result = await isAccountOnboarded(config, publicKey);
      isOnboarded = result.isOnboarded;

      if (isOnboarded && result.partyId) {
        xpubOrAddress = result.partyId;
      }
    }

    // Backfill publicKey for an already-onboarded account (xpub present but no
    // publicKey — e.g. synced before publicKey was captured). Deviceless: the
    // gateway party lookup returns it. Without publicKey, validateTopology can't
    // run and the topology-change prompt never shows. LIVE-34585
    if (xpubOrAddress && !publicKey) {
      const { public_key } = await getPartyById(config, xpubOrAddress);
      if (public_key) publicKey = public_key;
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpubOrAddress,
      derivationMode,
    });

    const { nativeInstrumentId } = config;
    // Without a party there is nothing to classify, so a fresh account scans without it.
    const nativeInstrument = xpubOrAddress
      ? await getNativeInstrumentOrSaved(
          context,
          config,
          initialAccount?.cantonResources?.nativeInstrumentAdmin,
        )
      : undefined;
    const balances = nativeInstrument
      ? await getInstrumentBalances(
          getCurrencyContext(context, currency),
          xpubOrAddress,
          nativeInstrument,
        )
      : [];
    const pendingTransferProposals = xpubOrAddress
      ? await getPendingTransferProposals(config, xpubOrAddress)
      : [];

    // Aggregate all balances by instrument (unlocked + locked)
    const aggregatedBalances = new Map<
      string,
      {
        unlockedBalance: bigint;
        lockedBalance: bigint;
        utxoCount: number;
        token: TokenCurrency | null;
        adminId: string;
      }
    >();

    const proposalInstrumentKeys = new Set(
      pendingTransferProposals.map(proposal =>
        getKey(proposal.instrument_id, proposal.instrument_admin),
      ),
    );
    for (const key of proposalInstrumentKeys) {
      if (aggregatedBalances.has(key)) continue;

      const [instrumentId, adminId] = key.split(SEPARATOR);
      balances.push({
        value: 0n,
        locked: 0n,
        utxoCount: 0,
        instrumentId,
        adminId,
        asset: { type: "token", assetReference: instrumentId },
      });
    }

    const calTokens = await getCalTokensCached(currency.id);
    const heldInstrumentIds = new Set(balances.map(balance => balance.instrumentId));
    // Keyed by admin too: any party can issue an instrument under a CAL token's id.
    const tokensByKey = new Map<string, TokenCurrency>();
    for (const [tokenId, instrumentId] of calTokens.entries()) {
      if (!heldInstrumentIds.has(instrumentId)) continue;
      const token = await getCryptoAssetsStore().findTokenById(tokenId);
      if (token?.contractAddress) {
        tokensByKey.set(getKey(instrumentId, token.contractAddress), token);
      }
    }

    for await (const balance of balances) {
      const isNative =
        !!nativeInstrument && isInstrument(nativeInstrument, balance.instrumentId, balance.adminId);
      // Use just instrumentId for native (no admin), composite key for tokens
      const balanceKey = isNative
        ? nativeInstrumentId
        : getKey(balance.instrumentId, balance.adminId);
      const token: TokenCurrency | null = isNative ? null : (tokensByKey.get(balanceKey) ?? null);

      const existing = aggregatedBalances.get(balanceKey);
      if (existing) {
        if (balance.locked) {
          existing.lockedBalance += balance.value;
        } else {
          existing.unlockedBalance += balance.value;
        }
        existing.utxoCount += balance.utxoCount;
      } else {
        aggregatedBalances.set(balanceKey, {
          unlockedBalance: balance.locked ? 0n : balance.value,
          lockedBalance: balance.locked ? balance.value : 0n,
          utxoCount: balance.utxoCount,
          token,
          adminId: balance.adminId,
        });
      }
    }

    const nativeBalance = aggregatedBalances.get(nativeInstrumentId);
    const unlockedAmount = new BigNumber((nativeBalance?.unlockedBalance ?? 0n).toString());
    const lockedAmount = new BigNumber((nativeBalance?.lockedBalance ?? 0n).toString());
    const totalBalance = unlockedAmount.plus(lockedAmount);
    const reserveMin = new BigNumber(config.minReserve || 0);
    const spendableBalance = BigNumber.max(0, unlockedAmount.minus(reserveMin));

    const instrumentUtxoCounts: Record<string, number> = {};
    for (const [key, data] of aggregatedBalances) {
      instrumentUtxoCounts[key] = data.utxoCount;
    }

    const tokenBalances = Array.from(aggregatedBalances.entries())
      .filter(([, data]) => data.token !== null)
      .map(([, { unlockedBalance, lockedBalance, token, adminId }]) => ({
        totalBalance: unlockedBalance + lockedBalance,
        spendableBalance: unlockedBalance,
        token: token!,
        adminId,
      }));

    // One snapshot, so that the rebuild check and the sub-accounts agree on the enabled tokens.
    const enabledInstruments =
      tokenBalances.length > 0 ? await getEnabledInstrumentsCached(config) : new Set<string>();
    const storedSubAccountIds = new Set(initialAccount?.subAccounts?.map(({ id }) => id));
    // Rows of a token without a sub-account produced no operation, and later syncs read past them.
    const hasNewTokenAccount = tokenBalances.some(
      ({ token }) =>
        isTokenEnabled(token, calTokens, enabledInstruments) &&
        !storedSubAccountIds.has(encodeTokenAccountId(accountId, token)),
    );

    // A stale sync hash, or a token that gets its sub-account, rebuilds the history from offset 0,
    // without the stored operations: merging them would drop the operations older than them.
    const isRebuild =
      initialAccount !== undefined && (initialAccount.syncHash !== SYNC_HASH || hasNewTokenAccount);
    const keptOperations = isRebuild ? [] : (initialAccount?.operations ?? []);
    const keptSubAccounts = (initialAccount?.subAccounts ?? []).map(subAccount =>
      isRebuild ? { ...subAccount, operations: [], operationsCount: 0 } : subAccount,
    );
    const allKeptOperations = [
      ...keptOperations,
      ...keptSubAccounts.flatMap(subAccount => subAccount.operations),
    ];

    const replay = initialAccount?.cantonResources?.replayTransactions ?? [];
    // Clearing the account, or restoring it while a token lookup fails, drops operations but keeps
    // the resources.
    const hasDroppedOperations =
      initialAccount?.blockHeight === 0 ||
      (initialAccount?.operations ?? []).length < (initialAccount?.operationsCount ?? 0);
    const checkpoint =
      isRebuild || hasDroppedOperations
        ? undefined
        : initialAccount?.cantonResources?.scanCheckpoint;

    // Main account operations: the native instrument only. By id alone: the gateway gives every
    // Amulet operation the same placeholder admin.
    const isMainAccountOperation = (op: Operation) =>
      (op.extra as { instrumentId?: string })?.instrumentId === nativeInstrumentId;

    const blockHeight = await getLedgerEnd(config);
    const { rows, isFullRead } = xpubOrAddress
      ? await readHistory(config, xpubOrAddress, checkpoint, blockHeight)
      : { rows: [], isFullRead: false };
    const validRows = rows.filter(isValidOperation);
    const validHashes = new Set(validRows.map(row => row.transaction_hash));
    const invalidHashes = new Set(
      rows.filter(row => !isValidOperation(row)).map(row => row.transaction_hash),
    );

    const pendingHashes = new Set(pendingTransferProposals.map(({ update_id }) => update_id));
    const replayHashes = new Set(replay.map(({ hash }) => hash));
    const storedHashes = new Set(allKeptOperations.map(({ hash }) => hash));
    // A transaction read again could come back degraded, and another type would duplicate it. After
    // a drop, a token can keep its operation of a transaction whose fee the main account lost.
    const isFinal = (hash: string) =>
      !hasDroppedOperations &&
      storedHashes.has(hash) &&
      !replayHashes.has(hash) &&
      !pendingHashes.has(hash);
    const fetchedOperations = toOperations(
      validRows.filter(row => !isFinal(row.transaction_hash)),
      accountId,
      xpubOrAddress,
      pendingHashes,
    );

    // A transaction of a pending offer stores its paid fees only. It is read again, in full, on
    // every sync until it settles, and replaces what it stored: a settled transaction can charge
    // its fees to another operation. Taken before a rebuild clears them, the stored operations of a
    // transaction not read in full stay, and the next sync reads it again. An offer stored in full
    // before it was listed as pending joins them when it is read again while pending, or its
    // stored fees would add to the fees read. Not under an older sync hash: the rebuild drops those
    // operations, and their fees can sit in an asset that no read charges again.
    const initialOperations = [
      ...(initialAccount?.operations ?? []),
      ...(initialAccount?.subAccounts ?? []).flatMap(subAccount => subAccount.operations),
    ];
    const joinableHashes = new Set(
      initialAccount?.syncHash === SYNC_HASH ? initialOperations.map(({ hash }) => hash) : [],
    );
    for (const { hash } of fetchedOperations) {
      if (pendingHashes.has(hash) && joinableHashes.has(hash)) replayHashes.add(hash);
    }
    const isReplayed = (op: Operation) => replayHashes.has(op.hash);
    const replayedOperations = initialOperations.filter(isReplayed);

    // Read in full: every row valid, and at least the fees it stored. A gateway that hides part of
    // a transaction would otherwise drop a fee the account paid.
    const unresolved = new Set(
      [...replayHashes].filter(
        hash =>
          !validHashes.has(hash) ||
          invalidHashes.has(hash) ||
          !coversFees(ofHash(fetchedOperations, hash), ofHash(replayedOperations, hash)),
      ),
    );
    const isUnresolved = (op: Operation) => unresolved.has(op.hash);
    const newOperations = [
      ...fetchedOperations.filter(op => !isUnresolved(op)),
      ...replayedOperations.filter(isUnresolved),
    ];

    const nextReplay = new Map(
      replay.filter(({ hash }) => unresolved.has(hash)).map(entry => [entry.hash, entry]),
    );
    // An offer the account received stores nothing while pending, so it is read again too, unless it
    // was stored before it was listed. One with an invalid row and no fees to replace only holds
    // the checkpoint while pending: replayed, it would hold it for good if the row stayed invalid.
    const fetchedHashes = new Set(fetchedOperations.map(({ hash }) => hash));
    const storedOfferHashes = new Set(
      allKeptOperations.filter(({ type }) => type === "TRANSFER_PROPOSAL").map(({ hash }) => hash),
    );
    const heldRows = rows.filter(
      ({ transaction_hash: hash }) =>
        pendingHashes.has(hash) && (fetchedHashes.has(hash) || !storedOfferHashes.has(hash)),
    );
    for (const { transaction_hash: hash, block } of heldRows) {
      const isReplayable = fetchedHashes.has(hash) || !invalidHashes.has(hash);
      if (isReplayable && !nextReplay.has(hash)) {
        nextReplay.set(hash, { hash, height: block.height });
      }
    }

    // The height of a transaction that a full read did not settle can be another node's.
    const isReplayPlaced = !isFullRead || unresolved.size === 0;
    const replayStart = Math.min(
      ...Array.from(nextReplay.values(), ({ height }) => height),
      ...heldRows.map(({ block }) => block.height),
    );
    const lastScanned = rows.filter(({ block }) => block.height < replayStart).at(-1);

    const storedOperations = keptOperations.filter(op => !isReplayed(op));
    const storedSubAccounts = keptSubAccounts.map(subAccount =>
      withoutReplayed(subAccount, isReplayed),
    );

    // Merged per account: operations of several assets in one transaction share an id.
    const mainAccountOperations = mergeOperations(
      storedOperations,
      newOperations.filter(isMainAccountOperation),
    );

    // Build sub-accounts for tokens with their filtered operations
    const subAccounts = buildSubAccounts({
      accountId,
      tokenBalances,
      existingSubAccounts: storedSubAccounts,
      allOperations: newOperations.filter(op => !isMainAccountOperation(op)),
      pendingTransferProposals,
      calTokens,
    });

    const cantonResources: CantonResources = {
      isOnboarded,
      instrumentUtxoCounts,
      pendingTransferProposals,
      ...(nativeInstrument ? { nativeInstrumentAdmin: nativeInstrument.instrumentAdmin } : {}),
      ...(publicKey ? { publicKey } : {}),
      ...(nextReplay.size > 0 ? { replayTransactions: [...nextReplay.values()] } : {}),
      ...(lastScanned && isReplayPlaced
        ? {
            scanCheckpoint: {
              hash: lastScanned.transaction_hash,
              height: lastScanned.block.height,
            },
          }
        : {}),
      xpub: xpubOrAddress,
    };

    const filteredSubAccounts = filterDisabledTokenAccounts(
      subAccounts,
      calTokens,
      enabledInstruments,
    );

    const used = !isCantonAccountEmpty({
      operationsCount: mainAccountOperations.length,
      balance: totalBalance,
      subAccounts: filteredSubAccounts,
      cantonResources,
    });

    const creationDate =
      mainAccountOperations.length > 0
        ? new Date(Math.min(...mainAccountOperations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      balance: totalBalance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      freshAddress: address,
      seedIdentifier: address,
      operations: mainAccountOperations,
      operationsCount: mainAccountOperations.length,
      spendableBalance,
      subAccounts: filteredSubAccounts,
      xpub: xpubOrAddress,
      used,
      cantonResources,
      syncHash: SYNC_HASH,
    };

    return shape;
  };
}
