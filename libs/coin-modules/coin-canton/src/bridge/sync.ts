import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
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
  type TransferProposal,
} from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner } from "../types";
import { buildSubAccounts } from "./buildSubAccounts";
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
 * Bumped whenever stored operations go stale, so that every account syncs again from scratch:
 * 1: fees in their own asset (ADR-068) — a token operation no longer carries the CC fee, which the
 * main account charges.
 */
export const SYNC_HASH = "1";

const GATEWAY_PAGE_SIZE = 100;

/** Operation types whose fee the account paid, so their value includes it. */
const CHARGED_TYPES: ReadonlySet<OperationType> = new Set(["OUT", "FEES"]);

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
 * Charges each fee in its own asset (ADR-068). A row's fee is that of its own transfer, and the
 * gateway sets it on the sender's row only. A fee in the row's asset joins the row's value; a fee
 * in another asset, in practice the CC fee of a token transfer, joins the transaction's operation
 * that the account paid in that asset, or a FEES operation of its own.
 */
function toOperations(rows: ValidOperationInfo[], accountId: string, partyId: string): Operation[] {
  const groups = new Map<string, OperationGroup>();
  const foreignFees = new Map<
    string,
    { row: ValidOperationInfo; instrument: Instrument; fee: BigNumber }
  >();

  for (const row of rows) {
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
    const memo = details?.metadata?.reason;
    if (memo !== undefined) group.memos.add(memo);
    if (isOwnFee) group.fee = group.fee.plus(fee);
    row.senders.forEach(sender => group.senders.add(sender));
    row.recipients.forEach(recipient => group.recipients.add(recipient));
    groups.set(key, group);

    if (!isOwnFee && feeInstrument && CHARGED_TYPES.has(type) && fee.gt(0)) {
      const feeKey = groupKey(row.transaction_hash, feeInstrument, "");
      const foreign = foreignFees.get(feeKey) ?? {
        row,
        instrument: feeInstrument,
        fee: new BigNumber(0),
      };
      foreign.fee = foreign.fee.plus(fee);
      foreignFees.set(feeKey, foreign);
    }
  }

  for (const { row, instrument, fee } of foreignFees.values()) {
    const payer = [...CHARGED_TYPES]
      .map(type => groups.get(groupKey(row.transaction_hash, instrument, type)))
      .find(group => group !== undefined);
    if (payer) {
      payer.fee = payer.fee.plus(fee);
      continue;
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

const filterOperations = (
  transactions: OperationInfo[],
  accountId: string,
  partyId: string,
  pendingTransferProposals: TransferProposal[],
): Operation[] => {
  const pendingUpdateIds = new Set(pendingTransferProposals.map(p => p.update_id));

  return toOperations(
    transactions
      .filter(txInfo => !pendingUpdateIds.has(txInfo.transaction_hash))
      .filter(isValidOperation),
    accountId,
    partyId,
  );
};

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

const highestBlockHeight = (operations: Operation[]): number | undefined =>
  operations.reduce<number | undefined>(
    (highest, { blockHeight }) =>
      typeof blockHeight === "number" && (highest === undefined || blockHeight > highest)
        ? blockHeight
        : highest,
    undefined,
  );

export async function filterDisabledTokenAccounts(
  config: CantonCoinConfig,
  subAccounts: TokenAccount[] | undefined,
  calTokens: Map<string, string>,
): Promise<TokenAccount[]> {
  if (!subAccounts || subAccounts.length === 0) {
    return [];
  }

  const enabledInstruments = await getEnabledInstrumentsCached(config);
  return subAccounts.filter(subAccount => {
    const instrumentId = calTokens.get(subAccount.token.id);
    const adminId = subAccount.token.contractAddress;
    if (!instrumentId || !adminId) {
      return false;
    }

    return enabledInstruments.has(getKey(instrumentId, adminId));
  });
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

    // A stale sync hash rebuilds the history from offset 0, without the stored operations.
    const isRebuild = initialAccount !== undefined && initialAccount.syncHash !== SYNC_HASH;
    const storedOperations = isRebuild ? [] : (initialAccount?.operations ?? []);
    const storedSubAccounts = (initialAccount?.subAccounts ?? []).map(subAccount =>
      isRebuild ? { ...subAccount, operations: [], operationsCount: 0 } : subAccount,
    );

    // Main account operations: the native instrument only. By id alone: the gateway gives every
    // Amulet operation the same placeholder admin.
    const isMainAccountOperation = (op: Operation) =>
      (op.extra as { instrumentId?: string })?.instrumentId === nativeInstrumentId;

    const blockHeight = await getLedgerEnd(config);
    let newOperations: Operation[] = [];
    if (xpubOrAddress) {
      // Token operations count too, or a run of them would be read again on every sync.
      const lastSyncedHeight = highestBlockHeight([
        ...storedOperations,
        ...storedSubAccounts.flatMap(subAccount => subAccount.operations),
      ]);
      const rows = await readOperations(
        config,
        xpubOrAddress,
        lastSyncedHeight === undefined ? 0 : lastSyncedHeight + 1,
        blockHeight,
      );
      newOperations = filterOperations(rows, accountId, xpubOrAddress, pendingTransferProposals);
    }

    // Merged per account: operations of several assets in one transaction share an id.
    const mainAccountOperations = mergeOps(
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
      xpub: xpubOrAddress,
    };

    const filteredSubAccounts = await filterDisabledTokenAccounts(config, subAccounts, calTokens);

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
