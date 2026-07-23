import flatten from "lodash/flatten";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { WalletBtcCurrency } from "./crypto/types";
import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { Currency } from "./crypto/types";
import { DerivationModes } from "./types";
import { Account, SerializedAccount } from "./account";
import Xpub from "./xpub";
import { IExplorer } from "./explorer/types";
import BitcoinLikeStorage from "./storage";
import * as utils from "./utils";
import cryptoFactory from "./crypto/factory";
import BitcoinLikeExplorer from "./explorer";
import { TX, Address, Output } from "./storage/types";
import { blockchainBaseURL } from "./explorer/baseUrl";

const hasExportedTxs = (value: unknown): value is { txs: TX[] } => {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray(Reflect.get(value, "txs"));
};

class BitcoinLikeWallet {
  explorers: { [currencyId: string]: IExplorer } = {};

  // Storage id is xpub + currency id
  storages: { [storageId: string]: BitcoinLikeStorage } = {};

  constructor() {}

  getExplorer(currency: WalletBtcCurrency) {
    const explorerURI = blockchainBaseURL(currency);
    if (!this.explorers[explorerURI]) {
      this.explorers[explorerURI] = new BitcoinLikeExplorer({
        cryptoCurrency: currency,
      });
    }
    return this.explorers[explorerURI];
  }

  async generateAccount(
    params: {
      xpub: string;
      path: string;
      index: number;
      // Selects the per-chain crypto rules via `cryptoFactory`. Kept as wallet-btc's own
      // `Currency` (not Ledger Live's `CryptoCurrency`) to preserve the dependency inversion.
      currency: Currency;
      network: "mainnet" | "testnet";
      derivationMode: DerivationModes;
    },
    cryptoCurrency: WalletBtcCurrency,
  ): Promise<Account> {
    const explorerURI = blockchainBaseURL(cryptoCurrency);
    this.explorers[explorerURI] = this.getExplorer(cryptoCurrency);
    const crypto = cryptoFactory(params.currency);
    const storageId = params.xpub + cryptoCurrency.id + cryptoCurrency.explorerEndpoint;
    if (!this.storages[storageId]) {
      this.storages[storageId] = new BitcoinLikeStorage();
    }
    return {
      params,
      xpub: new Xpub({
        storage: this.storages[storageId],
        explorer: this.explorers[explorerURI],
        crypto,
        xpub: params.xpub,
        derivationMode: params.derivationMode,
      }),
    };
  }

  async syncAccount(account: Account, currentBlockHeight?: number): Promise<void> {
    account.xpub.currentBlockHeight = currentBlockHeight;
    await account.xpub.sync();
    if (currentBlockHeight) {
      account.xpub.syncedBlockHeight = currentBlockHeight;
    }
  }

  async getAccountNewReceiveAddress(account: Account): Promise<Address> {
    const address = await account.xpub.getNewAddress(0, 1);
    return address;
  }

  async getAccountNewChangeAddress(account: Account): Promise<Address> {
    const address = await account.xpub.getNewAddress(1, 1);
    return address;
  }

  async getAccountTransactions(account: Account): Promise<{ txs: TX[] }> {
    const exported = await account.xpub.storage.export();
    return hasExportedTxs(exported) ? exported : { txs: [] };
  }

  async getAccountUnspentUtxos(account: Account): Promise<Output[]> {
    const addresses = await account.xpub.getXpubAddresses();
    return flatten(
      await Promise.all(
        addresses.map(address => account.xpub.storage.getAddressUnspentUtxos(address)),
      ),
    );
  }

  async estimateAccountMaxSpendable(
    account: Account,
    feePerByte: number,
    excludeUTXOs: Array<{ hash: string; outputIndex: number }>,
    outputAddresses: string[] = [],
    opReturnData?: Buffer,
  ): Promise<BigNumber> {
    const addresses = await account.xpub.getXpubAddresses();
    const changeAddresses = (await account.xpub.getAccountAddresses(1)).map(item => item.address);

    const utxos = flatten(
      await Promise.all(
        addresses.map(address => account.xpub.storage.getAddressUnspentUtxos(address)),
      ),
    );

    // Group UTXOs by transaction hash to avoid fetching the same tx multiple times
    const txHashToUtxos = new Map<string, Output[]>();
    utxos.forEach(utxo => {
      if (!txHashToUtxos.has(utxo.output_hash)) {
        txHashToUtxos.set(utxo.output_hash, []);
      }
      txHashToUtxos.get(utxo.output_hash)!.push(utxo);
    });

    // Fetch unique transaction hexes
    const uniqueTxHashes = Array.from(txHashToUtxos.keys());
    const txHexResults = await Promise.allSettled(
      uniqueTxHashes.map(hash => account.xpub.explorer.getTxHex(hash)),
    );

    // Build list of valid UTXOs (those whose transaction hex was fetched successfully)
    const successfulUtxos: Output[] = [];
    txHexResults.forEach((res, index) => {
      const txHash = uniqueTxHashes[index];
      if (res.status === "fulfilled") {
        const utxosFromTx = txHashToUtxos.get(txHash)!;
        successfulUtxos.push(...utxosFromTx);
      }
    });

    let balance = new BigNumber(0);
    log("btcwallet", "estimateAccountMaxSpendable utxos", utxos);
    const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));
    const fixedVBytes = utils.maxTxVBytesCeil(
      0,
      [],
      false,
      account.xpub.crypto,
      account.xpub.derivationMode,
    );
    const oneInputVBytes =
      utils.maxTxVBytesCeil(1, [], false, account.xpub.crypto, account.xpub.derivationMode) -
      fixedVBytes;
    let usableUtxoCount = 0;
    successfulUtxos.forEach(utxo => {
      if (
        !excludeUTXOs.find(
          excludeUtxo =>
            excludeUtxo.hash === utxo.output_hash && excludeUtxo.outputIndex === utxo.output_index,
        )
      ) {
        // we can use non-pending utxos or change utxo (whether pending or not)
        // NOTE: check ledger-live-common/src/families/bitcoin/docs/RBF.md for more details
        if (changeAddresses.includes(utxo.address) || utxo.block_height !== null) {
          const effectiveValue = Number(utxo.value) - safeFeePerByte * oneInputVBytes;
          if (effectiveValue <= 0) {
            return;
          }
          usableUtxoCount++;
          balance = balance.plus(utxo.value);
        }
      }
    });

    const outputScripts = outputAddresses.map(addr => account.xpub.crypto.toOutputScript(addr));

    if (opReturnData) {
      outputScripts.push(account.xpub.crypto.toOpReturnOutputScript(opReturnData));
    }

    // fees if we use all utxo
    const fees =
      safeFeePerByte *
      utils.maxTxSizeCeil(
        usableUtxoCount,
        outputScripts,
        outputScripts.length === 0,
        account.xpub.crypto,
        account.xpub.derivationMode,
      );

    log("btcwallet", "estimateAccountMaxSpendable balance", balance);
    log("btcwallet", "estimateAccountMaxSpendable fees", fees);
    const maxSpendable = balance.minus(fees);
    return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
  }

  async getAccountBalance(account: Account): Promise<BigNumber> {
    const balance = await account.xpub.getXpubBalance();
    return balance;
  }

  async getAccountPendings(account: Account): Promise<TX[]> {
    const addresses = await account.xpub.getXpubAddresses();
    return flatten(
      await Promise.all(addresses.map(address => account.xpub.explorer.getPendings(address))),
    );
  }

  async getAccountTxBlockHeight(account: Account, hash: string): Promise<number | null> {
    return await account.xpub.explorer.getTxBlockHeight(hash);
  }

  async broadcastTx(
    fromAccount: Account,
    tx: string,
    broadcastConfig?: Pick<BroadcastConfig, "source">,
  ): Promise<string> {
    const res = await fromAccount.xpub.broadcastTx(tx, broadcastConfig);
    return res.data.result;
  }

  instantiateXpubFromSerializedAccount(
    account: SerializedAccount,
    cryptoCurrency: WalletBtcCurrency,
  ): Xpub {
    const currencyId = account.params.currency;
    const crypto = cryptoFactory(currencyId);
    const storageId = account.xpub.xpub + currencyId;
    if (!this.storages[storageId]) {
      this.storages[storageId] = new BitcoinLikeStorage();
    }
    return new Xpub({
      storage: this.storages[storageId],
      explorer: this.getExplorer(cryptoCurrency),
      crypto,
      xpub: account.xpub.xpub,
      derivationMode: account.params.derivationMode,
    });
  }

  async importFromSerializedAccount(
    account: SerializedAccount,
    cryptoCurrency: WalletBtcCurrency,
  ): Promise<Account> {
    const xpub = this.instantiateXpubFromSerializedAccount(account, cryptoCurrency);

    await xpub.storage.load(account.xpub.data);

    return {
      ...account,
      xpub,
    };
  }

  importFromSerializedAccountSync(
    account: SerializedAccount,
    cryptoCurrency: WalletBtcCurrency,
  ): Account {
    const xpub = this.instantiateXpubFromSerializedAccount(account, cryptoCurrency);

    xpub.storage.loadSync(account.xpub.data);

    return {
      ...account,
      xpub,
    };
  }

  async exportToSerializedAccount(account: Account): Promise<SerializedAccount> {
    const data = await account.xpub.storage.export();

    return {
      ...account,
      xpub: {
        xpub: account.xpub.xpub,
        data,
      },
    };
  }

  exportToSerializedAccountSync(account: Account): SerializedAccount {
    const data = account.xpub.storage.exportSync();

    return {
      ...account,
      xpub: {
        xpub: account.xpub.xpub,
        data,
      },
    };
  }
}

export default BitcoinLikeWallet;
