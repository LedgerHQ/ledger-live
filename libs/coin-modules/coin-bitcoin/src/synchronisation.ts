import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
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
import type { Currency, Output as WalletOutput } from "./wallet-btc";
import wallet, { DerivationModes as WalletDerivationModes } from "./wallet-btc";
import { BitcoinAccount, BitcoinOutput, BtcOperation } from "./types";
import { perCoinLogic, mapTxToOperations } from "./logic";
import { BitcoinXPub, SignerContext } from "./signer";
import { merge, Observable } from "rxjs";
import { getChainAdapter } from "./chain-adapters/registry";

const TWO_HOUR_MS = 2 * 60 * 60 * 1000;
const COINBASE_INPUT_PREFIX = "0000000000000000000000000000000000000000000000000000000000000000";

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
 * Removes replaced Bitcoin transactions based on inputs and RBF logic.
 *
 * This function is used primarily to handle Replace-By-Fee (RBF) transactions.
 * In some situations, we might fetch both the original (unconfirmed) transaction
 * and the one that replaces it (usually with a higher fee). Without deduplication, both can
 * remain displayed, confusing the user—especially when the replaced one never confirms.
 *
 * Key Rules:
 * - A UTXO (input) can only be spent once.
 * - If multiple transactions share an input, we keep the one that is:
 *   1. Confirmed (has a `blockHeight`) over an unconfirmed one.
 *   2. Of higher `blockHeight` if both are confirmed or both are unconfirmed.
 *   3. Of later `date` if both share the same `blockHeight` (or lack thereof).
 * - Coinbase transactions (with input starting with all 0s) are always kept.
 * - Transactions without extra.inputs (usually `OUT` transactions) are always kept.
 *
 * Outcome:
 * The result is a filtered list of operations, cleaned of unconfirmed or superseded
 * transactions that were replaced using RBF logic or similar.
 *
 * @param operations An array of BtcOperation items (e.g. from sync).
 * @returns A filtered array of operations with replaced transactions removed.
 *  The original order of operations is preserved.
 */
export const removeReplaced = (
  operations: BtcOperation[],
  now = Date.now(),
  preferMostRecentWhenSameHeight = false,
): BtcOperation[] => {
  const isConfirmed = (op: BtcOperation): boolean => typeof op.blockHeight === "number";
  const getInputs = (op: BtcOperation): string[] => op.extra?.inputs ?? [];
  const isCoinbase = (op: BtcOperation): boolean =>
    getInputs(op).some((input: string) => input.startsWith(COINBASE_INPUT_PREFIX));
  const toDateMs = (op: BtcOperation): number => new Date(op.date).getTime();

  const shouldReplaceExistingOperation = (existingOp: BtcOperation, op: BtcOperation): boolean => {
    const existingConfirmed = isConfirmed(existingOp);
    const newConfirmed = isConfirmed(op);

    if (existingConfirmed && !newConfirmed) return false;
    if (!existingConfirmed && newConfirmed) return true;

    const newHeight = op.blockHeight ?? -1;
    const existingHeight = existingOp.blockHeight ?? -1;

    if (newHeight !== existingHeight) return newHeight > existingHeight;
    if (!preferMostRecentWhenSameHeight) return false;
    return toDateMs(op) > toDateMs(existingOp);
  };

  const shouldKeepBothWhenSameHeight = (existingOp: BtcOperation, op: BtcOperation): boolean => {
    if (preferMostRecentWhenSameHeight) return false;
    return (op.blockHeight ?? -1) === (existingOp.blockHeight ?? -1);
  };

  const isSupersededUnconfirmedOperation = (
    op: BtcOperation,
    txByInput: Map<string, BtcOperation>,
  ) =>
    !isConfirmed(op) &&
    getInputs(op).some((input: string) => {
      const existing = txByInput.get(input);
      return existing !== undefined && existing.hash !== op.hash && isConfirmed(existing);
    });

  const isExpiredUnconfirmed = (op: BtcOperation): boolean =>
    !isConfirmed(op) && now > toDateMs(op) + TWO_HOUR_MS;

  const addOperationForInput = (
    input: string,
    op: BtcOperation,
    txByInput: Map<string, BtcOperation>,
    uniqueOperations: Map<string, BtcOperation>,
  ): void => {
    txByInput.set(input, op);
    uniqueOperations.set(op.hash, op);
  };

  const handleInput = (
    input: string,
    op: BtcOperation,
    txByInput: Map<string, BtcOperation>,
    uniqueOperations: Map<string, BtcOperation>,
  ): void => {
    const existingOp = txByInput.get(input);

    if (!existingOp) {
      if (!isSupersededUnconfirmedOperation(op, txByInput)) {
        addOperationForInput(input, op, txByInput, uniqueOperations);
      }
      return;
    }

    if (isConfirmed(existingOp) && !isConfirmed(op)) {
      uniqueOperations.delete(op.hash);
      return;
    }

    if (shouldReplaceExistingOperation(existingOp, op)) {
      uniqueOperations.delete(existingOp.hash);
      addOperationForInput(input, op, txByInput, uniqueOperations);
      return;
    }

    if (shouldKeepBothWhenSameHeight(existingOp, op)) {
      uniqueOperations.set(op.hash, op);
    }
  };

  // used to track the most recent operation for each input.
  const txByInput = new Map<string, BtcOperation>();

  // ensures we maintain a list of unique transactions by hash.
  const uniqueOperations = new Map<string, BtcOperation>(); // Keep track of unique transactions

  for (const op of operations) {
    const inputs = getInputs(op);
    if (inputs.length === 0) {
      uniqueOperations.set(op.hash, op);
      continue;
    }

    if (isCoinbase(op)) {
      uniqueOperations.set(op.hash, op);
      continue;
    }

    for (const input of inputs) {
      handleInput(input, op, txByInput, uniqueOperations);
    }
  }

  return operations.filter(op => uniqueOperations.has(op.hash) && !isExpiredUnconfirmed(op));
};

// wallet-btc limitation: returns all transactions twice (for each side of the tx)
// so we need to deduplicate them...
const deduplicateOperations = (operations: (BtcOperation | undefined)[]): BtcOperation[] => {
  const seen = new Set();
  const out: BtcOperation[] = [];
  let j = 0;

  for (const operation of operations) {
    if (operation) {
      if (!seen.has(operation.id)) {
        seen.add(operation.id);
        out[j++] = operation;
      }
    }
  }

  return out;
};

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
      currency,
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

  const newOperations = transactions
    ?.map(tx => mapTxToOperations(tx, currency.id, accountId, accountAddresses, changeAddresses))
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
  const adapter = getChainAdapter(currency.id);
  const balance = adapter.computeAccountBalance
    ? adapter.computeAccountBalance(initialAccount, transparentBalance)
    : transparentBalance;

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

export const postSync = (initial: BitcoinAccount, synced: BitcoinAccount) => {
  log("bitcoin/postSync", "bitcoinResources");
  const perCoin = perCoinLogic[synced.currency.id];
  const syncedBtc = synced;
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

  log("bitcoin/postSync", "bitcoinResources DONE");
  return syncedBtc;
};
