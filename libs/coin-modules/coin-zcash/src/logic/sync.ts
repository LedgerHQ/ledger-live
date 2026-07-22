import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { defer, from, map, merge, mergeMap, Observable, scan } from "rxjs";
import type {
  AccountShapeInfo,
  GetAccountShapeStream,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
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
import type { Currency, Output as WalletOutput, TX, Input as WalletInput } from "@ledgerhq/wallet-btc/index";
import wallet, { DerivationModes as WalletDerivationModes } from "@ledgerhq/wallet-btc/index";
import { removeReplaced, deduplicateOperations } from "@ledgerhq/wallet-btc/operations";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { BitcoinOutput, BtcOperation, ZcashAccount } from "../types/bridge";
import type { BitcoinXPub, SignerContext } from "../types/signer";
import type { ShieldedSyncResult, ShieldedTransaction, ZcashPrivateInfo } from "../network/types";
import { toWalletBtcCurrency } from "./walletBtcCurrency";
import { computeZcashBalance, getTransparentBalance } from "./balance";
import { computeBalanceFromNotes, convertShieldedTransactionsToOperations } from "./operations";
import { DEFAULT_ZCASH_PRIVATE_INFO, getZainoEndpoint } from "../constants";
import { getZCashClient } from "./engineClient";
import { composeXpub } from "../signer/xpub";

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

export const fromWalletUtxo = (utxo: WalletOutput, changeAddresses: Set<string>): BitcoinOutput => ({
  hash: utxo.output_hash,
  outputIndex: utxo.output_index,
  blockHeight: utxo.block_height,
  address: utxo.address,
  value: new BigNumber(utxo.value),
  rbf: utxo.rbf,
  isChange: changeAddresses.has(utxo.address),
});

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
  const operations: BtcOperation[] = [];
  const txId = tx.id;
  const fee = new BigNumber(tx.fees ?? 0);
  const blockHeight = tx.block?.height;
  const blockHash = tx.block?.hash;
  const date = new Date(tx.block?.time || tx.received_at);
  const senders = new Set<string>();
  const recipients: string[] = [];
  let type: OperationType = "OUT";
  let value = new BigNumber(0);
  const hasFailed = false;
  const accountInputs: WalletInput[] = [];
  const accountOutputs: WalletOutput[] = [];
  const inputs = new Set<`${string}-${number}`>();

  for (const input of tx.inputs) {
    if (input.output_hash) {
      inputs.add(`${input.output_hash}-${input.output_index}`);
    }
    if (input.address) {
      senders.add(input.address);
      if (input.value && accountAddresses.has(input.address)) {
        value = value.plus(input.value);
        accountInputs.push(input);
      }
    }
  }

  const hasSpentNothing = value.eq(0);
  const changeOutputIndex =
    tx.outputs.length === 0
      ? 0
      : tx.outputs.map(o => o.output_index).reduce((p, c) => (p > c ? p : c));

  for (const output of tx.outputs) {
    if (output.address && !output.address.includes("unknown")) {
      if (!accountAddresses.has(output.address)) {
        if (
          accountInputs.length > 0 &&
          (tx.outputs.length === 1 || output.output_index < changeOutputIndex)
        ) {
          recipients.push(output.address);
        }
      } else {
        accountOutputs.push(output);
        if (!changeAddresses.has(output.address)) {
          recipients.push(output.address);
        } else if (
          (recipients.length === 0 && output.output_index >= changeOutputIndex) ||
          hasSpentNothing
        ) {
          recipients.push(output.address);
        }
      }
    }
  }

  if (accountInputs.length > 0) {
    for (const output of accountOutputs) {
      if (changeAddresses.has(output.address)) {
        value = value.minus(output.value);
      }
    }

    type = "OUT";
    operations.push({
      id: encodeOperationId(accountId, txId, type),
      hash: txId,
      type,
      value,
      fee,
      senders: Array.from(senders),
      recipients,
      blockHeight,
      blockHash,
      accountId,
      date,
      hasFailed,
      extra: { inputs: Array.from(inputs) },
    } as BtcOperation);
  }

  if (accountOutputs.length > 0) {
    const filterChangeAddresses = !!accountInputs.length;
    let accountOutputCount = 0;
    let finalAmount = new BigNumber(0);

    for (const output of accountOutputs) {
      if (!filterChangeAddresses || !changeAddresses.has(output.address)) {
        finalAmount = finalAmount.plus(output.value);
        accountOutputCount += 1;
      }
    }

    if (accountOutputCount > 0) {
      value = finalAmount;
      type = "IN";
      operations.push({
        id: encodeOperationId(accountId, txId, type),
        hash: txId,
        type,
        value,
        fee,
        senders: Array.from(senders),
        recipients,
        blockHeight,
        blockHash,
        accountId,
        date,
        hasFailed,
        extra: { inputs: Array.from(inputs) },
      } as BtcOperation);
    }
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

  const newOperations = transactions
    ?.map(tx => mapTxToOperations(tx, accountId, accountAddresses, changeAddresses))
    .flat();

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
    return [...inputs].sort().join("|");
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
    spendableBalance: transparentBalance,
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
): Promise<BitcoinXPub> {
  if (providedXpub) return providedXpub;

  const { deviceId, currency, signerContext, accountPath } = params;
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const { bitcoinLikeInfo } = currency;
  const { XPUBVersion: xpubVersion } = bitcoinLikeInfo as { XPUBVersion: number };

  // coin-zcash always composes the xpub locally (see signer/xpub.ts) -- the
  // DMK Zcash signer kit only exposes getAddress, not a native xpub command.
  const accountPathElements = accountPath.split("/").filter(Boolean);
  if (accountPathElements.length === 0) {
    throw new Error(`Cannot derive xpub from empty path "${accountPath}"`);
  }
  const parentPath = accountPath.split("/").slice(0, -1).join("/");
  const lastElement = accountPathElements[accountPathElements.length - 1];
  const childNumber = parseInt(lastElement.replace("'", ""), 10);

  const [parent, account] = await Promise.all([
    signerContext(deviceId, signer => signer.getAddress(parentPath, false)),
    signerContext(deviceId, signer => signer.getAddress(accountPath, false)),
  ]);

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

    const knownNullifiers: string[] = [
      ...new Set(
        (transactions ?? []).flatMap(tx =>
          (tx.decryptedData?.orchard_outputs ?? [])
            .filter(
              n =>
                n.isSpent !== true &&
                n.nullifier !== undefined &&
                (n.transfer_type === "incoming" || n.transfer_type === "internal"),
            )
            .map(n => n.nullifier!),
        ),
      ),
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

  if (newTransactions.length === 0) {
    const totalBlocks = result.processedBlocks + result.remainingBlocks;
    const spentNfs = result.spentKnownNullifiers ?? [];
    let updatedTransactions = existingPrivateInfo.transactions;
    if (spentNfs.length > 0) {
      const spentSet = new Set(spentNfs);
      updatedTransactions = updatedTransactions.map(tx => {
        const outputs = tx.decryptedData?.orchard_outputs;
        if (!outputs?.some(n => n.nullifier && spentSet.has(n.nullifier))) return tx;
        return {
          ...tx,
          decryptedData: {
            orchard_outputs: outputs.map(n =>
              n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
            ),
            sapling_outputs: tx.decryptedData?.sapling_outputs ?? [],
          },
        };
      });
    }
    const orchardBalance =
      spentNfs.length > 0
        ? computeBalanceFromNotes(updatedTransactions)
        : existingPrivateInfo.orchardBalance;
    return {
      ...accumulated,
      accountUpdate: {
        ...accumulated.accountUpdate,
        balance: computeZcashBalance(transparentBalance, {
          orchardBalance,
          saplingBalance: existingPrivateInfo.saplingBalance,
        }),
        blockHeight: result.lastProcessedBlock ?? accumulated.accountUpdate.blockHeight ?? 0,
        privateInfo: {
          ...existingPrivateInfo,
          syncState: result.remainingBlocks > 0 ? ("running" as const) : ("complete" as const),
          progress:
            totalBlocks > 0 ? Math.round((result.processedBlocks / totalBlocks) * 100) : 100,
          lastProcessedBlock: result.lastProcessedBlock ?? null,
          lastSyncTimestamp: Date.now(),
          transactions: updatedTransactions,
          orchardBalance,
        },
      },
    };
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

  const spentNfs = result.spentKnownNullifiers ?? [];
  if (spentNfs.length > 0) {
    const spentSet = new Set(spentNfs);
    for (let i = 0; i < allShieldedTx.length; i++) {
      const tx = allShieldedTx[i];
      const outputs = tx.decryptedData?.orchard_outputs;
      if (!outputs?.some(n => n.nullifier && spentSet.has(n.nullifier))) continue;
      allShieldedTx[i] = {
        ...tx,
        decryptedData: {
          orchard_outputs: outputs.map(n =>
            n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
          ),
          sapling_outputs: tx.decryptedData?.sapling_outputs ?? [],
        },
      };
    }
  }

  const orchardBalance = computeBalanceFromNotes(allShieldedTx);
  const saplingBalance = accumulated.accountUpdate.privateInfo?.saplingBalance ?? new BigNumber(0);

  const totalBlocks = result.processedBlocks + result.remainingBlocks;
  const privateInfo: ZcashPrivateInfo = {
    saplingBalance,
    orchardBalance,
    syncState: result.remainingBlocks > 0 ? ("running" as const) : ("complete" as const),
    progress: totalBlocks > 0 ? Math.round((result.processedBlocks / totalBlocks) * 100) : 100,
    estimatedTimeRemaining: existingPrivateInfo.estimatedTimeRemaining ?? { hours: 0, minutes: 0 },
    ufvk: existingPrivateInfo?.ufvk ?? null,
    birthday: existingPrivateInfo?.birthday ?? null,
    lastSyncTimestamp: Date.now(),
    lastProcessedBlock: result.lastProcessedBlock ?? null,
    transactions: allShieldedTx,
  };

  log("zcash/reduceShieldedSyncResult", `Processed ${newOperations.length} new shielded operations`, {
    accountId,
    totalOperations: operations.length,
  });

  const missingOpsCount = Math.max(
    0,
    (info.initialAccount?.operationsCount ?? 0) - (info.initialAccount?.operations?.length ?? 0),
  );

  return {
    processedOperations: [...result.transactions],
    accountUpdate: {
      ...accumulated.accountUpdate,
      balance: computeZcashBalance(transparentBalance, { orchardBalance, saplingBalance }),
      operations,
      operationsCount: missingOpsCount + operations.length,
      blockHeight: result.lastProcessedBlock ?? info.initialAccount?.blockHeight ?? 0,
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

  const syncStateIsEnabled =
    !!zcashInitialAccount &&
    (zcashInitialAccount.privateInfo?.syncState === "ready" ||
      zcashInitialAccount.privateInfo?.syncState === "running" ||
      zcashInitialAccount.privateInfo?.syncState === "stopped" ||
      zcashInitialAccount.privateInfo?.syncState === "outdated");

  if (!ufvkIsPresent || !syncStateIsEnabled) return undefined;

  const shieldedSyncRaw = zcashSyncShielded(info, syncConfig);
  return createShieldedSyncObservable(info, shieldedSyncRaw);
}

// ── Merged getAccountShape (transparent + shielded) ─────────────────────
//
// coin-zcash owns both halves itself (no coin-bitcoin fallback): every sync
// always runs the transparent leg, and adds the shielded leg when eligible.

export function buildSyncObservables(
  info: AccountShapeInfo<ZcashAccount>,
  syncConfig: SyncConfig,
  signerContext: SignerContext,
): { syncs: Observable<Partial<ZcashAccount>>[]; syncType: number } {
  const syncType = syncConfig.syncType ?? SYNC_TYPE_TRANSPARENT;
  const syncs: Observable<Partial<ZcashAccount>>[] = [];

  if (syncType & SYNC_TYPE_TRANSPARENT) {
    syncs.push(createTransparentSyncObservable(info, signerContext));
  }

  const extraSync = buildExtraSyncObservable(info, syncConfig);
  if (extraSync) syncs.push(extraSync);

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

export const postSync = (_initial: ZcashAccount, synced: ZcashAccount): ZcashAccount => synced;
