import type { Currency, Output as WalletOutput } from "./wallet-btc";
import { DerivationModes as WalletDerivationModes } from "./wallet-btc";
import { BigNumber } from "bignumber.js";
import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Account, Operation, DerivationMode } from "../../types";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { findCurrencyExplorer } from "../../api/Ledger";
import { encodeAccountId } from "../../account";
import {
  isSegwitDerivationMode,
  isNativeSegwitDerivationMode,
  isTaprootDerivationMode,
} from "../../derivation";
import { BitcoinOutput } from "./types";
import { perCoinLogic } from "./logic";
import wallet from "./wallet-btc";
import { getAddressWithBtcInstance } from "./hw-getAddress";
import { mapTxToOperations } from "./logic";

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

  const paramXpub = initialAccount?.xpub;

  let generatedXpub;
  if (!paramXpub) {
    // Xpub not provided, generate it using the hwapp

    if (!transport) {
      // hwapp not provided
      throw new Error("hwapp required to generate the xpub");
    }
    const btc = new Btc(transport);
    const { bitcoinLikeInfo } = currency;
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
  const walletDerivationMode = toWalletDerivationMode(derivationMode);
  const explorer = findCurrencyExplorer(currency);
  if (!explorer) {
    throw new Error(`No explorer found for currency ${currency.name}`);
  }
  if (explorer.version !== "v2" && explorer.version !== "v3") {
    throw new Error(`Unsupported explorer version ${explorer.version}`);
  }

  const walletAccount =
    initialAccount?.bitcoinResources?.walletAccount ||
    (await wallet.generateAccount({
      xpub,
      path: rootPath,
      index,
      currency: <Currency>currency.id,
      network: walletNetwork,
      derivationMode: walletDerivationMode,
      explorer: `ledger${explorer.version}`,
      explorerURI: `${explorer.endpoint}/blockchain/${explorer.version}/${explorer.id}`,
      storage: "mock",
      storageParams: [],
    }));

  const oldOperations = initialAccount?.operations || [];
  await wallet.syncAccount(walletAccount);
  const balance = await wallet.getAccountBalance(walletAccount);
  const currentBlock = await walletAccount.xpub.explorer.getCurrentBlock();
  const blockHeight = currentBlock?.height;

  // @ts-expect-error return from wallet-btc should be typed
  const { txs: transactions } = await wallet.getAccountTransactions(
    walletAccount
  );

  const accountAddresses: Set<string> = new Set<string>();
  const accountAddressesWithInfo = await walletAccount.xpub.getXpubAddresses();
  accountAddressesWithInfo.forEach((a) => accountAddresses.add(a.address));

  const changeAddresses: Set<string> = new Set<string>();
  const changeAddressesWithInfo =
    await walletAccount.xpub.storage.getUniquesAddresses({
      account: 1,
    });
  changeAddressesWithInfo.forEach((a) => changeAddresses.add(a.address));

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
  const newUniqueOperations = deduplicateOperations(newOperations);
  const operations = mergeOps(oldOperations, newUniqueOperations);
  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const utxos = rawUtxos.map((utxo) => fromWalletUtxo(utxo, changeAddresses));
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

  if (perCoin) {
    const { postBuildBitcoinResources, syncReplaceAddress } = perCoin;

    if (postBuildBitcoinResources) {
      synced.bitcoinResources = postBuildBitcoinResources(
        synced,
        synced.bitcoinResources
      );
    }

    if (syncReplaceAddress) {
      synced.freshAddress = syncReplaceAddress(synced.freshAddress);
      synced.freshAddresses = synced.freshAddresses.map((a) => ({
        ...a,
        address: syncReplaceAddress(a.address),
      }));
      if (synced.bitcoinResources) {
        synced.bitcoinResources.utxos = synced.bitcoinResources?.utxos.map(
          (u) => ({
            ...u,
            address: u.address && syncReplaceAddress(u.address),
          })
        );
      }
    }
  }

  log("bitcoin/postSync", "bitcoinResources DONE");
  return synced;
};

const getAddressFn = (transport) => {
  const btc = new Btc(transport);
  return (opts) => getAddressWithBtcInstance(transport, btc, opts);
};

export const scanAccounts = makeScanAccounts({
  getAccountShape,
  getAddressFn,
});
export const sync = makeSync({ getAccountShape, postSync });
