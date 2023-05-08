import type { Currency, Output as WalletOutput } from "./wallet-btc";
import { DerivationModes as WalletDerivationModes } from "./wallet-btc";
import { BigNumber } from "bignumber.js";
import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
  DerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { BitcoinAccount, BitcoinOutput } from "./types";
import { perCoinLogic } from "./logic";
import wallet from "./wallet-btc";
import { getAddress } from "./hw-getAddress";
import { mapTxToOperations } from "./logic";
import { Account, Operation } from "@ledgerhq/types-live";
import { decodeAccountId } from "../../account/index";
import { startSpan } from "../../performance";

// Map LL's DerivationMode to wallet-btc's
const toWalletDerivationMode = (
  mode: DerivationMode
): WalletDerivationModes => {
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
const fromWalletUtxo = (
  utxo: WalletOutput,
  changeAddresses: Set<string>
): BitcoinOutput => {
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

// wallet-btc limitation: returns all transactions twice (for each side of the tx)
// so we need to deduplicate them...
const deduplicateOperations = (
  operations: (Operation | undefined)[]
): Operation[] => {
  const seen = {};
  const out: Operation[] = [];
  let j = 0;

  for (const operation of operations) {
    if (operation) {
      if (seen[operation.id] !== 1) {
        seen[operation.id] = 1;
        out[j++] = operation;
      }
    }
  }

  return out;
};

const getAccountShape: GetAccountShape = async (info) => {
  let span;
  const {
    transport,
    currency,
    index,
    derivationPath,
    derivationMode,
    initialAccount,
  } = info;
  // In case we get a full derivation path, extract the seed identification part
  // 44'/0'/0'/0/0 --> 44'/0'
  // FIXME Only the CLI provides a full derivationPath: why?
  const rootPath = derivationPath.split("/", 2).join("/");
  const accountPath = `${rootPath}/${index}'`;

  const paramXpub = initialAccount
    ? decodeAccountId(initialAccount.id).xpubOrAddress
    : undefined;

  let generatedXpub;
  if (!paramXpub) {
    // Xpub not provided, generate it using the hwapp

    if (!transport) {
      // hwapp not provided
      throw new Error("hwapp required to generate the xpub");
    }
    const { bitcoinLikeInfo } = currency;
    const btc = new Btc({ transport, currency: currency.id });
    const { XPUBVersion: xpubVersion } = bitcoinLikeInfo as {
      // FIXME It's supposed to be optional
      //XPUBVersion?: number;
      XPUBVersion: number;
    };
    generatedXpub = await btc.getWalletXpub({ path: accountPath, xpubVersion });
  }
  const xpub = paramXpub || generatedXpub;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });

  const walletNetwork = toWalletNetwork(currency.id);
  const walletDerivationMode = toWalletDerivationMode(
    derivationMode as DerivationMode
  );

  span = startSpan("sync", "generateAccount");
  const walletAccount =
    (initialAccount as BitcoinAccount)?.bitcoinResources?.walletAccount ||
    (await wallet.generateAccount(
      {
        xpub,
        path: rootPath,
        index,
        currency: <Currency>currency.id,
        network: walletNetwork,
        derivationMode: walletDerivationMode,
      },
      currency
    ));
  span.finish();

  const oldOperations = initialAccount?.operations || [];
  await wallet.syncAccount(walletAccount);
  const balance = await wallet.getAccountBalance(walletAccount);
  const currentBlock = await walletAccount.xpub.explorer.getCurrentBlock();
  const blockHeight = currentBlock?.height;

  span = startSpan("sync", "getAccountTransactions");
  const { txs: transactions } = await wallet.getAccountTransactions(
    walletAccount
  );
  span.finish();

  span = startSpan("sync", "getXpubAddresses");
  const accountAddresses: Set<string> = new Set<string>();
  const accountAddressesWithInfo = await walletAccount.xpub.getXpubAddresses();
  accountAddressesWithInfo.forEach((a) => accountAddresses.add(a.address));
  span.finish();

  span = startSpan("sync", "getUniquesAddresses");
  const changeAddresses: Set<string> = new Set<string>();
  const changeAddressesWithInfo =
    await walletAccount.xpub.storage.getUniquesAddresses({
      account: 1,
    });
  changeAddressesWithInfo.forEach((a) => changeAddresses.add(a.address));
  span.finish();

  span = startSpan("sync", "mapTxToOperations");
  const newOperations = transactions
    ?.map((tx) =>
      mapTxToOperations(
        tx,
        currency.id,
        accountId,
        accountAddresses,
        changeAddresses
      )
    )
    .flat();
  span.finish();

  span = startSpan("sync", "unify operations");
  const newUniqueOperations = deduplicateOperations(newOperations);
  const operations = mergeOps(oldOperations, newUniqueOperations);
  span.finish();

  span = startSpan("sync", "gather utxos");
  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const utxos = rawUtxos.map((utxo) => fromWalletUtxo(utxo, changeAddresses));
  span.finish();

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

const postSync = (initial: Account, synced: Account) => {
  log("bitcoin/postSync", "bitcoinResources");
  const perCoin = perCoinLogic[synced.currency.id];
  const syncedBtc = synced as BitcoinAccount;
  if (perCoin) {
    const { postBuildBitcoinResources, syncReplaceAddress } = perCoin;

    if (postBuildBitcoinResources) {
      syncedBtc.bitcoinResources = postBuildBitcoinResources(
        syncedBtc,
        syncedBtc.bitcoinResources
      );
    }

    if (syncReplaceAddress) {
      syncedBtc.freshAddress = syncReplaceAddress(syncedBtc.freshAddress);
      syncedBtc.freshAddresses = syncedBtc.freshAddresses.map((a) => ({
        ...a,
        address: syncReplaceAddress(a.address),
      }));
      if (syncedBtc.bitcoinResources) {
        syncedBtc.bitcoinResources.utxos =
          syncedBtc.bitcoinResources?.utxos.map((u) => ({
            ...u,
            address: u.address && syncReplaceAddress(u.address),
          }));
      }
    }
  }

  log("bitcoin/postSync", "bitcoinResources DONE");
  return syncedBtc;
};

const getAddressFn = (transport) => {
  return (opts) => getAddress(transport, opts);
};

export const scanAccounts = makeScanAccounts({
  getAccountShape,
  getAddressFn,
});
export const sync = makeSync({ getAccountShape, postSync });
