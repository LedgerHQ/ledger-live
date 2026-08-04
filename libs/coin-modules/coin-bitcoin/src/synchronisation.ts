import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { toWalletBtcCurrency } from "./walletBtcCurrency";
import type {
  AccountShapeInfo,
  GetAccountShapeStream,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId, decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { DerivationMode, SYNC_TYPE_TRANSPARENT, SyncConfig } from "@ledgerhq/types-live";
import type { Currency, Output as WalletOutput } from "@ledgerhq/wallet-btc/index";
import wallet, { DerivationModes as WalletDerivationModes } from "@ledgerhq/wallet-btc/index";
import { removeReplaced, deduplicateOperations } from "@ledgerhq/wallet-btc/operations";
// re-exported for backward compatibility (consumers/tests import it from here)
export { removeReplaced } from "@ledgerhq/wallet-btc/operations";
import { BitcoinAccount, BitcoinOutput, BtcOperation } from "./types";
import { perCoinLogic, mapTxToOperations } from "./logic";
import { BitcoinXPub, SignerContext } from "./signer";
import { merge, Observable } from "rxjs";
import { getChainAdapter } from "./chain-adapters/registry";
import type { ResolvedTransactions } from "./chain-adapters/types";

// Map LL's DerivationMode to wallet-btc's
const toWalletDerivationMode = (mode: DerivationMode): WalletDerivationModes => {
  if (isTaprootDerivationMode(mode)) {
    return WalletDerivationModes.TAPROOT;
  }
  if (isNativeSegwitDerivationMode(mode)) {
    return WalletDerivationModes.NATIVE_SEGWIT;
  }
  if (isSegwitDerivationMode(mode)) {
    return WalletDerivationModes.SEGWIT;
  }
  return WalletDerivationModes.LEGACY;
};

// Map LL's currency ID to wallet-btc's Account.params.network
const toWalletNetwork = (currencyId: string): "testnet" | "mainnet" => {
  return getCryptoCurrencyById(currencyId).isTestnetFor ? "testnet" : "mainnet";
};

// Map wallet-btc's Output to LL's BitcoinOutput
export const fromWalletUtxo = (utxo: WalletOutput, changeAddresses: Set<string>): BitcoinOutput => {
  return {
    hash: utxo.output_hash,
    outputIndex: utxo.output_index,
    blockHeight: utxo.block_height,
    address: utxo.address,
    value: new BigNumber(utxo.value),
    rbf: utxo.rbf,
    isChange: changeAddresses.has(utxo.address),
  };
};

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

export async function performTransparentSync(
  info: AccountShapeInfo<BitcoinAccount>,
  signerContext: SignerContext,
): Promise<Partial<BitcoinAccount>> {
  const { currency, index, derivationPath, derivationMode, initialAccount, deviceId } = info;

  // In case we get a full derivation path, extract the seed identification part
  // 44'/0'/0'/0/0 --> 44'/0'
  // FIXME Only the CLI provides a full derivationPath: why?
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
  const changeAddressesWithInfo = walletAccount.xpub.storage.getUniquesAddresses({
    account: 1,
  });
  changeAddressesWithInfo.forEach(a => changeAddresses.add(a.address));

  const adapter = getChainAdapter(currency.id);

  // The explorer cannot always see enough of a transaction to report its fee or
  // its destination. Give the chain a chance to recover both before operations
  // are derived, so that senders and recipients agree on the fee.
  //
  // This reaches the network, and it is an enrichment: a sync that already holds
  // the explorer's answer must not be lost because that reach failed.
  let resolved: ResolvedTransactions | undefined;
  try {
    resolved = await adapter.resolveTransactionDetails?.(transactions, initialAccount);
  } catch (error) {
    log("bitcoin/performTransparentSync", `Keeping the explorer's view of ${currency.id}`, {
      error,
    });
  }

  const newOperations = (resolved?.transactions ?? transactions)
    ?.map(tx => mapTxToOperations(tx, currency.id, accountId, accountAddresses, changeAddresses))
    .flat()
    .map(op => (op ? withRecoveredRecipients(op, resolved?.payeesByTxId, changeAddresses) : op));

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
  // 1) Keep operations that have the same hash as those utxos
  const utxoHashes = new Set(utxos.map(u => u.hash));
  const operationsOfUtxos = balanceOperations.filter(op => utxoHashes.has(op.hash));

  // 2) Keep only one operation when multiple operations share the same inputs
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
    if (!existing || isBetterCandidate(op, existing)) {
      bestOpByInputsKey.set(key, op);
    }
  }

  const finalOperationsOfUtxos = operationsOfUtxos.filter(op => {
    const key = getInputsKey(op);
    if (!key) return true;
    return bestOpByInputsKey.get(key)?.hash === op.hash;
  });

  // 3) Filter the original utxos to keep the ones that share a hash with the final operations
  const finalOperationHashes = new Set(finalOperationsOfUtxos.map(op => op.hash));
  const finalUtxos =
    finalOperationHashes.size > 0
      ? utxos.filter(utxo => finalOperationHashes.has(utxo.hash))
      : utxos;

  const transparentBalance = finalUtxos.reduce(
    (total, utxo) => total.plus(utxo.value),
    new BigNumber(0),
  );

  // Chains with off-transparent funds (e.g. Zcash shielded notes) combine them
  // into `account.balance` via their chain adapter; others use the transparent
  // balance as-is.
  const balance = adapter.computeAccountBalance
    ? adapter.computeAccountBalance(initialAccount, transparentBalance)
    : transparentBalance;

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

export function createTransparentSyncObservable(
  info: AccountShapeInfo<BitcoinAccount>,
  signerContext: SignerContext,
): Observable<Partial<BitcoinAccount>> {
  const currencyId = info.currency.id;
  log("bitcoin/createTransparentSyncObservable", `Initiating transparent sync for ${currencyId}`);
  return new Observable<Partial<BitcoinAccount>>(subscriber => {
    performTransparentSync(info, signerContext)
      .then(result => {
        log(
          "bitcoin/createTransparentSyncObservable",
          `Transparent sync completed for ${currencyId}`,
          {
            operationsCount: result.operationsCount,
            blockHeight: result.blockHeight,
            balance: result.balance?.toString(),
            spendableBalance: result.spendableBalance?.toString(),
          },
        );
        subscriber.next(result);
        subscriber.complete();
      })
      .catch(error => {
        log("bitcoin/createTransparentSyncObservable", `Transparent sync error for ${currencyId}`, {
          error: error.message,
        });
        subscriber.error(error);
      });
  });
}

export function buildSyncObservables(
  info: AccountShapeInfo<BitcoinAccount>,
  syncConfig: SyncConfig,
  signerContext: SignerContext,
): { syncs: Observable<Partial<BitcoinAccount>>[]; syncType: number } {
  const { currency } = info;
  const syncType = syncConfig.syncType ?? SYNC_TYPE_TRANSPARENT;

  const syncs: Observable<Partial<BitcoinAccount>>[] = [];

  if (syncType & SYNC_TYPE_TRANSPARENT) {
    syncs.push(createTransparentSyncObservable(info, signerContext));
  }

  // Chain adapter guards (syncType flags, ufvk, syncState) are checked internally
  const adapter = getChainAdapter(currency.id);
  const extraSync = adapter.buildExtraSyncObservable?.(info, syncConfig);
  if (extraSync) {
    syncs.push(extraSync);
  }

  return { syncs, syncType };
}

export function makeGetAccountShape(
  signerContext: SignerContext,
): GetAccountShapeStream<BitcoinAccount> {
  return (info: AccountShapeInfo<BitcoinAccount>, syncConfig: SyncConfig) =>
    new Observable(o => {
      const { currency } = info;
      const { syncs, syncType } = buildSyncObservables(info, syncConfig, signerContext);

      if (syncs.length === 0) {
        log("bitcoin/makeGetAccountShape", `No syncs to perform for ${currency.id}`);
        o.complete();
        return;
      }

      log("bitcoin/makeGetAccountShape", `Merging ${syncs.length} sync(s) for ${currency.id}`, {
        hasTransparent: !!(syncType & SYNC_TYPE_TRANSPARENT),
        syncCount: syncs.length,
      });

      const sub = merge(...syncs).subscribe({
        next: result => {
          log("bitcoin/makeGetAccountShape", `Sync update received for ${currency.id}`, {
            blockHeight: result.blockHeight,
            operationsCount: result.operationsCount,
            hasBitcoinResources: !!result.bitcoinResources,
          });
          o.next(result);
        },
        complete: () => {
          log("bitcoin/makeGetAccountShape", `All syncs completed for ${currency.id}`);
          o.complete();
        },
        error: error => {
          log("bitcoin/makeGetAccountShape", `Sync error for ${currency.id}`, {
            error: error.message,
          });
          o.error(error);
        },
      });
      // Propagate unsubscription from the outer Observable to the inner merge.
      // Without this, calling unsubscribe() on the outer subscription has no effect
      // on the running sync streams.
      return () => sub.unsubscribe();
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
  if (providedXpub) {
    return Promise.resolve(providedXpub);
  }

  // Xpub not provided, generate it using the hwapp

  const { deviceId, currency, signerContext, accountPath } = params;
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const { bitcoinLikeInfo } = currency;
  const { XPUBVersion: xpubVersion } = bitcoinLikeInfo as {
    // FIXME It's supposed to be optional
    //XPUBVersion?: number;
    XPUBVersion: number;
  };

  const adapter = getChainAdapter(currency.id);
  const custom = adapter.getWalletXpub?.(
    deviceId,
    { currency, accountPath, xpubVersion },
    signerContext,
  );
  if (custom) {
    return custom;
  }

  return signerContext(deviceId, currency, signer =>
    signer.getWalletXpub({
      path: accountPath,
      xpubVersion,
    }),
  );
}

/**
 * Reconcile optimistic operations with their now-confirmed counterparts.
 *
 * `shouldRetainPendingOperation` matches on operation id, and an id embeds the
 * operation type: the optimistic operation created at signing time is an `OUT`,
 * while the confirmed one a sync produces may carry a chain-specific type (a
 * Zcash shielded send, for instance). The two never match, so the pending entry
 * survives next to its own confirmed counterpart until the optimistic retention
 * window expires. The transaction hash is what actually identifies them.
 *
 * Before dropping the optimistic operation, take from it the address the user
 * actually entered. It is the most faithful answer available — a chain that
 * recovers a destination from the transaction can only report the receiver it
 * finds there, which for a unified address bundling several receivers is the
 * same destination written differently.
 */
function reconcileConfirmedPendingOperations(account: BitcoinAccount): BitcoinAccount {
  if (account.pendingOperations.length === 0) return account;

  const pendingByHash = new Map(account.pendingOperations.map(op => [op.hash, op]));
  const operations = account.operations.map(op => {
    const optimistic = pendingByHash.get(op.hash);
    // An incoming operation shares its hash with the send that produced it, but
    // it is not the operation that paid the entered address.
    if (!optimistic?.recipients.length || op.type.endsWith("IN")) return op;
    return { ...op, recipients: optimistic.recipients };
  });

  // Only the optimistic operations that now have a confirmed counterpart are
  // resolved; the rest are still in flight.
  const confirmedHashes = new Set(account.operations.map(op => op.hash));
  const pendingOperations = account.pendingOperations.filter(op => !confirmedHashes.has(op.hash));

  return { ...account, operations, pendingOperations };
}

export const postSync = (initial: BitcoinAccount, synced: BitcoinAccount) => {
  log("bitcoin/postSync", "bitcoinResources");
  const perCoin = perCoinLogic[synced.currency.id];
  let syncedBtc = synced;
  if (perCoin) {
    const { postBuildBitcoinResources, syncReplaceAddress } = perCoin;

    // FIXME: unused, can remove?
    if (postBuildBitcoinResources) {
      syncedBtc.bitcoinResources = postBuildBitcoinResources(syncedBtc, syncedBtc.bitcoinResources);
    }

    if (syncReplaceAddress) {
      syncedBtc.freshAddress = syncReplaceAddress(syncedBtc.freshAddress);
      if (syncedBtc.bitcoinResources) {
        syncedBtc.bitcoinResources.utxos = syncedBtc.bitcoinResources?.utxos.map(u => ({
          ...u,
          address: u.address && syncReplaceAddress(u.address),
        }));
      }
    }
  }

  syncedBtc = reconcileConfirmedPendingOperations(syncedBtc);

  log("bitcoin/postSync", "bitcoinResources DONE");
  return syncedBtc;
};
