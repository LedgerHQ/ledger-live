import type { Currency, Output as WalletOutput } from "./wallet-btc";
import wallet, { DerivationModes as WalletDerivationModes } from "./wallet-btc";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { BitcoinAccount, BitcoinOutput, BtcOperation } from "./types";
import { perCoinLogic } from "./logic";
import { mapTxToOperations } from "./logic";
import { DerivationMode } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BitcoinXPub, SignerContext } from "./signer";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

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
export const removeReplaced = (operations: BtcOperation[], now = Date.now()): BtcOperation[] => {
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
            if (uniqueOperations.has(op.hash)) {
              uniqueOperations.delete(op.hash); // Remove the unconfirmed transaction if it was previously added
            }
            continue; // Keep the confirmed transaction
          }

          if (!isExistingConfirmed && isNewOpConfirmed) {
            uniqueOperations.delete(existingOp.hash); // Remove unconfirmed transaction
            txByInput.set(input, op); // Store the confirmed transaction
            uniqueOperations.set(op.hash, op);
          } else {
            // Compare block height first
            if ((op.blockHeight ?? -1) > (existingOp.blockHeight ?? -1)) {
              uniqueOperations.delete(existingOp.hash);
              txByInput.set(input, op);
              uniqueOperations.set(op.hash, op);
            } else if ((op.blockHeight ?? -1) === (existingOp.blockHeight ?? -1)) {
              uniqueOperations.set(op.hash, op);
              continue;
            }
          }
        } else {
          // First time we see this input: only add op if it is not superseded.
          // An unconfirmed op is superseded if any of its inputs is already spent by a confirmed tx.
          const opIsSuperseded =
            typeof op.blockHeight !== "number" &&
            op.extra.inputs.some((inp: string) => {
              const existing = txByInput.get(inp);
              return (
                existing !== undefined &&
                existing.hash !== op.hash &&
                typeof existing.blockHeight === "number"
              );
            });
          if (!opIsSuperseded) {
            txByInput.set(input, op);
            uniqueOperations.set(op.hash, op);
          }
        }
      }
    } else {
      // Store transactions without inputs (they shouldn't be removed)
      uniqueOperations.set(op.hash, op);
    }
  }

  return operations.filter(
    op =>
      uniqueOperations.has(op.hash) &&
      !(
        (op.blockHeight === null || op.blockHeight === undefined) &&
        now > new Date(op.date).getTime() + TWO_WEEKS_MS
      ),
  );
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

export function makeGetAccountShape(signerContext: SignerContext): GetAccountShape<BitcoinAccount> {
  return async info => {
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
    const keptOperationHashes = new Set(operations.map(op => op.hash));
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
    const operationsOfUtxos = operations.filter(op => utxoHashes.has(op.hash));

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

    const balance = finalUtxos.reduce((total, utxo) => total.plus(utxo.value), new BigNumber(0));

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
        utxos: finalUtxos,
        walletAccount,
      },
    };
  };
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
