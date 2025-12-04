import type { Currency, Output as WalletOutput } from "./wallet-btc";
import { DerivationModes as WalletDerivationModes } from "./wallet-btc";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { GetAccountShapeStream } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { BitcoinAccount, BitcoinOutput, BtcOperation, isZcashAccount, ZcashAccount } from "./types";
import { perCoinLogic } from "./logic";
import wallet from "./wallet-btc";
import { mapTxToOperations } from "./logic";
import { DerivationMode, SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { CryptoCurrency, CoinType } from "@ledgerhq/types-cryptoassets";
import { BitcoinXPub, SignerContext } from "./signer";
import { Observable, merge } from "rxjs";
import { map, scan } from "rxjs/operators";
import { getCoinConfig } from "./config";
import type { ShieldedTransaction, ShieldedSyncResult } from "@ledgerhq/zcash-shielded";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

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
const fromWalletUtxo = (utxo: WalletOutput, changeAddresses: Set<string>): BitcoinOutput => {
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
 * Converts raw shielded transactions to BtcOperation format.
 * This function processes the blockchain-agnostic shielded transaction data
 * and converts it to Bitcoin-specific operation types.
 */
function convertShieldedTransactionsToOperations(
  shieldedTransactions: ShieldedTransaction[],
  accountId: string,
): BtcOperation[] {
  return shieldedTransactions.map(tx => {
    const operation: BtcOperation = {
      id: encodeOperationId(accountId, tx.hash, tx.type),
      hash: tx.hash,
      accountId,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight,
      type: tx.type,
      senders: tx.senders,
      recipients: tx.recipients,
      date: tx.timestamp,
      value: new BigNumber(tx.value),
      fee: new BigNumber(tx.fee),
      extra: {},
      transactionSequenceNumber: new BigNumber(tx.blockHeight),
      subOperations: [],
      nftOperations: [],
    };

    return operation;
  });
}


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
export const removeReplaced = (operations: BtcOperation[]): BtcOperation[] => {
  // used to track the most recent operation for each input.
  const txByInput = new Map<string, BtcOperation>();

  // ensures we maintain a list of unique transactions by hash.
  const uniqueOperations = new Map<string, BtcOperation>(); // Keep track of unique transactions

  for (const op of operations) {
    if (op.extra?.inputs?.length) {
      for (const input of op.extra.inputs) {
        // Ensure coinbase transactions are always stored
        if (
          op.extra.inputs.some((input: string) =>
            input.startsWith("0000000000000000000000000000000000000000000000000000000000000000"),
          )
        ) {
          uniqueOperations.set(op.hash, op);
          continue; // ✅ Skip processing further, but KEEP it
        }
        const existingOp = txByInput.get(input);
        if (existingOp) {
          const isExistingConfirmed = typeof existingOp.blockHeight === "number";
          const isNewOpConfirmed = typeof op.blockHeight === "number";

          if (isExistingConfirmed && !isNewOpConfirmed) {
            continue; // Keep the confirmed transaction
          }

          if (!isExistingConfirmed && isNewOpConfirmed) {
            uniqueOperations.delete(existingOp.hash); // Remove unconfirmed transaction
            txByInput.set(input, op); // Store the confirmed transaction
          } else {
            // Compare block height first
            if ((op.blockHeight ?? -1) > (existingOp.blockHeight ?? -1)) {
              uniqueOperations.delete(existingOp.hash);
              txByInput.set(input, op);
            } else if ((op.blockHeight ?? -1) === (existingOp.blockHeight ?? -1)) {
              if (new Date(op.date) > new Date(existingOp.date)) {
                uniqueOperations.delete(existingOp.hash);
                txByInput.set(input, op);
              } else if (new Date(op.date) < new Date(existingOp.date)) {
                continue; // If date is older, disregard
              } else {
                // edge case, date equal, keep both
                uniqueOperations.set(op.hash, op);
                continue;
              }
            }
          }
        } else {
          txByInput.set(input, op);
        }

        uniqueOperations.set(op.hash, op);
      }
    } else {
      // Store transactions without inputs (they shouldn't be removed)
      uniqueOperations.set(op.hash, op);
    }
  }

  return operations.filter(op => uniqueOperations.has(op.hash));
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

export function makeGetAccountShape(
  signerContext: SignerContext,
): GetAccountShapeStream<BitcoinAccount> {
  return (info, syncConfig) =>
    new Observable(o => {
      const { currency, index, derivationPath, derivationMode, initialAccount, deviceId } = info;
      // Enable both transparent and shielded sync for Zcash accounts by default
      const defaultSyncType =
        currency.coinType === CoinType.ZCASH
          ? SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED
          : SYNC_TYPE_TRANSPARENT;
      const { syncType = defaultSyncType } = syncConfig;
      const transparentSync = async (): Promise<Partial<BitcoinAccount>> => {
        console.log("RABL bitcoin/transparent", `Starting transparent sync for ${currency.id}`, {
          index,
          derivationPath,
          initialBlockHeight: initialAccount?.blockHeight,
        });

        // In case we get a full derivation path, extract the seed identification part
        // 44'/0'/0'/0/0 --> 44'/0'
        // FIXME Only the CLI provides a full derivationPath: why?
        const rootPath = derivationPath.split("/", 2).join("/");
        const accountPath = `${rootPath}/${index}'`;

        const paramXpub = initialAccount
          ? decodeAccountId(initialAccount.id).xpubOrAddress
          : undefined;

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

        const balance = await wallet.getAccountBalance(walletAccount);
        const { txs: transactions } = await wallet.getAccountTransactions(walletAccount);

        const accountAddresses: Set<string> = new Set<string>();
        const accountAddressesWithInfo = await walletAccount.xpub.getXpubAddresses();
        accountAddressesWithInfo.forEach(a => accountAddresses.add(a.address));

        const changeAddresses: Set<string> = new Set<string>();
        const changeAddressesWithInfo = await walletAccount.xpub.storage.getUniquesAddresses({
          account: 1,
        });
        changeAddressesWithInfo.forEach(a => changeAddresses.add(a.address));

        const newOperations = transactions
          ?.map(tx =>
            mapTxToOperations(tx, currency.id, accountId, accountAddresses, changeAddresses),
          )
          .flat();

        const newUniqueOperations = deduplicateOperations(newOperations);

        const _operations = mergeOps(oldOperations, newUniqueOperations);
        const operations = removeReplaced(_operations as BtcOperation[]);

        const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
        const utxos = rawUtxos.map(utxo => fromWalletUtxo(utxo, changeAddresses));

        console.log("RABL bitcoin/transparent", `Transparent sync completed for ${currency.id}`, {
          accountId,
          blockHeight,
          operationsCount: operations.length,
          balance: balance.toString(),
          utxosCount: utxos.length,
        });

        return {
          id: accountId,
          xpub,
          balance,
          spendableBalance: balance,
          operations,
          operationsCount: operations.length,
          freshAddress: walletAccount.xpub.freshAddress,
          freshAddressPath: `${accountPath}/0/${walletAccount.xpub.freshAddressIndex}`,
          blockHeight,
          bitcoinResources: {
            utxos,
            walletAccount,
          },
        };
      };

      const syncs: Observable<Partial<BitcoinAccount>>[] = [];

      if (syncType & SYNC_TYPE_TRANSPARENT) {
        console.log("RABL bitcoin/sync", `Initiating transparent sync for ${currency.id}`);
        syncs.push(
          new Observable<Partial<BitcoinAccount>>(subscriber => {
        transparentSync()
              .then(result => {
                console.log(
                  "RABL bitcoin/sync",
                  `Transparent sync result received for ${currency.id}`,
                  {
                    operationsCount: result.operationsCount,
                    blockHeight: result.blockHeight,
                  },
                );
                subscriber.next(result);
                subscriber.complete();
              })
              .catch(error => {
                console.log("RABL bitcoin/sync", `Transparent sync error for ${currency.id}`, {
                  error: error.message,
                });
                subscriber.error(error);
              });
          }),
        );
      }

      const isZcash = initialAccount && isZcashAccount(initialAccount);
      const ShieldedEnabled = isZcash ? (initialAccount as ZcashAccount).isZcashShieldedActivated : false;
      if (syncType & SYNC_TYPE_SHIELDED && ShieldedEnabled) {
        console.log("RABL bitcoin/sync", `Initiating shielded sync for ${currency.id}`);
        const shieldedSyncRaw = getCoinConfig(currency).family.sync?.(info, syncConfig);
        if (shieldedSyncRaw) {
          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: currency.id,
            xpubOrAddress: info.initialAccount?.xpub || "",
            derivationMode: info.derivationMode,
          });

          const shieldedSync = shieldedSyncRaw.pipe(
            scan(
              (
                accumulated: {
                  processedOperations: ShieldedTransaction[];
                  accountUpdate: Partial<BitcoinAccount>;
                },
                result: ShieldedSyncResult,
              ) => {
                const processedIds = new Set(accumulated.processedOperations.map(tx => tx.hash));
                const newTransactions = result.operations.filter(tx => !processedIds.has(tx.hash));

                if (newTransactions.length === 0) {
                  return {
                    ...accumulated,
                    accountUpdate: {
                      ...accumulated.accountUpdate,
                      blockHeight: result.latestBlockHeight,
                    },
                  };
                }

                const newOperations = convertShieldedTransactionsToOperations(
                  newTransactions,
                  accountId,
                );

                const currentOperations = (accumulated.accountUpdate.operations ||
                  []) as BtcOperation[];
                const mergedOperations = mergeOps(currentOperations, newOperations);
                const operations = removeReplaced(mergedOperations as BtcOperation[]);

                // Calculate balance incrementally
                let balance =
                  accumulated.accountUpdate.balance ||
                  info.initialAccount?.balance ||
                  new BigNumber(0);
                for (const op of newOperations) {
                  if (op.type === "IN") {
                    balance = balance.plus(op.value);
                  } else if (op.type === "OUT") {
                    balance = balance.minus(op.value).minus(op.fee);
                  }
                }

                console.log(
                  "RABL bitcoin/shielded",
                  `Processed ${newOperations.length} new shielded operations`,
                  {
                    accountId,
                    totalOperations: operations.length,
                    latestBlockHeight: result.latestBlockHeight,
                    balance: balance.toString(),
                    previousOperations: currentOperations.length,
                  },
                );

                return {
                  processedOperations: result.operations, // Track all processed operations
                  accountUpdate: {
                    operations,
                    operationsCount: operations.length,
                    balance,
                    spendableBalance: balance, // For shielded, spendable = balance
                    blockHeight: result.latestBlockHeight,
                  },
                };
              },
              {
                processedOperations: [],
                accountUpdate: {
                  operations: (info.initialAccount?.operations || []) as BtcOperation[],
                  balance: info.initialAccount?.balance,
                  blockHeight: info.initialAccount?.blockHeight,
                } as Partial<BitcoinAccount>,
              },
            ),
            map(accumulated => accumulated.accountUpdate),
          );
          syncs.push(shieldedSync);
        } else {
          console.log("RABL bitcoin/sync", `No shielded sync available for ${currency.id}`);
        }
      }

      if (syncs.length === 0) {
        console.log("RABL bitcoin/sync", `No syncs to perform for ${currency.id}`);
        o.complete();
        return;
      }

      console.log("RABL bitcoin/sync", `Merging ${syncs.length} sync(s) for ${currency.id}`, {
        hasTransparent: !!(syncType & SYNC_TYPE_TRANSPARENT),
        hasShielded: !!(syncType & SYNC_TYPE_SHIELDED),
      });

      // Merge all syncs - emit results as they come
      // The framework's makeSync will handle merging multiple partial updates
      merge(...syncs).subscribe({
        next: result => {
          console.log("RABL bitcoin/sync", `Sync update received for ${currency.id}`, {
            blockHeight: result.blockHeight,
            operationsCount: result.operationsCount,
            hasBitcoinResources: !!result.bitcoinResources,
          });
          o.next(result);
        },
        complete: () => {
          console.log("RABL bitcoin/sync", `All syncs completed for ${currency.id}`);
      o.complete();
        },
        error: error => {
          console.log("RABL bitcoin/sync", `Sync error for ${currency.id}`, {
            error: error.message,
          });
          o.error(error);
        },
      });
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
