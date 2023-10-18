import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import Btc from "@ledgerhq/hw-app-btc";
import { Transaction } from "@ledgerhq/hw-app-btc/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { flatten } from "lodash";
import { blockchainBaseURL } from "../../../explorer";
import { Account, SerializedAccount } from "./account";
import cryptoFactory from "./crypto/factory";
import { Currency } from "./crypto/types";
import BitcoinLikeExplorer from "./explorer";
import { IExplorer } from "./explorer/types";
import { PickingStrategy } from "./pickingstrategies/types";
import BitcoinLikeStorage from "./storage";
import { Address, Output, TX } from "./storage/types";
import { DerivationModes, TransactionInfo } from "./types";
import * as utils from "./utils";
import Xpub from "./xpub";

class BitcoinLikeWallet {
  explorers: { [currencyId: string]: IExplorer } = {};

  // Storage id is xpub + currency id
  storages: { [storageId: string]: BitcoinLikeStorage } = {};

  constructor() {}

  getExplorer(currency: CryptoCurrency) {
    if (!this.explorers[currency.id]) {
      this.explorers[currency.id] = new BitcoinLikeExplorer({
        cryptoCurrency: currency,
      });
    }
    return this.explorers[currency.id];
  }

  async generateAccount(
    params: {
      xpub: string;
      path: string;
      index: number;
      // FIXME: currency should be removed and instead use CryptoCurrency
      currency: Currency;
      network: "mainnet" | "testnet";
      derivationMode: DerivationModes;
    },
    cryptoCurrency: CryptoCurrency,
  ): Promise<Account> {
    const explorerURI = blockchainBaseURL(cryptoCurrency);
    this.explorers[explorerURI] = this.getExplorer(cryptoCurrency);
    const crypto = cryptoFactory(params.currency);
    const storageId = params.xpub + cryptoCurrency.id;
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

  async syncAccount(account: Account): Promise<void> {
    return account.xpub.sync();
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
    const txs = (await account.xpub.storage.export()) as { txs: TX[] };
    return txs;
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

    let balance = new BigNumber(0);
    log("btcwallet", "estimateAccountMaxSpendable utxos", utxos);
    let usableUtxoCount = 0;
    utxos.forEach(utxo => {
      if (
        !excludeUTXOs.find(
          excludeUtxo =>
            excludeUtxo.hash === utxo.output_hash && excludeUtxo.outputIndex === utxo.output_index,
        )
      ) {
        // we can use either non pending utxo or change utxo
        if (changeAddresses.includes(utxo.address) || utxo.block_height !== null) {
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
      feePerByte *
      utils.maxTxSizeCeil(
        usableUtxoCount,
        outputScripts,
        outputScripts.length == 0,
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

  async buildAccountTx(params: {
    fromAccount: Account;
    dest: string;
    amount: BigNumber;
    feePerByte: number;
    utxoPickingStrategy: PickingStrategy;
    sequence: number;
    opReturnData?: Buffer;
  }): Promise<TransactionInfo> {
    const changeAddress = await params.fromAccount.xpub.getNewAddress(1, 1);
    const txInfo = await params.fromAccount.xpub.buildTx({
      destAddress: params.dest,
      amount: params.amount,
      feePerByte: params.feePerByte,
      changeAddress,
      utxoPickingStrategy: params.utxoPickingStrategy,
      sequence: params.sequence,
      opReturnData: params.opReturnData,
    });

    return txInfo;
  }

  async signAccountTx(params: {
    btc: Btc;
    fromAccount: Account;
    txInfo: TransactionInfo;
    lockTime?: number;
    sigHashType?: number;
    segwit?: boolean;
    hasTimestamp?: boolean;
    initialTimestamp?: number;
    additionals?: Array<string>;
    expiryHeight?: Buffer;
    hasExtraData?: boolean;
    onDeviceSignatureRequested?: () => void;
    onDeviceSignatureGranted?: () => void;
    onDeviceStreaming?: (arg0: { progress: number; total: number; index: number }) => void;
  }): Promise<string> {
    const {
      btc,
      fromAccount,
      txInfo,
      initialTimestamp,
      additionals,
      hasExtraData,
      onDeviceSignatureRequested,
      onDeviceSignatureGranted,
      onDeviceStreaming,
    } = params;

    const orderedInputs: TransactionInfo["inputs"] = utils.lexicographicalIndexingTransactionInputs(
      { inputs: txInfo.inputs },
    );
    const orderedOutputs: TransactionInfo["outputs"] =
      utils.lexicographicalIndexingTransactionOutputs({
        outputs: txInfo.outputs,
      });

    let hasTimestamp = params.hasTimestamp;

    let length = orderedOutputs.reduce((sum, output) => {
      return sum + 8 + output.script.length + 1;
    }, 1);

    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L478
    // Decred has a witness and an expiry height
    if (additionals && additionals.includes("decred")) {
      length += 2 * orderedOutputs.length;
    }

    const buffer = Buffer.allocUnsafe(length);

    let bufferOffset = 0;
    bufferOffset = utils.writeVarInt(buffer, orderedOutputs.length, bufferOffset);

    orderedOutputs.forEach(txOut => {
      // refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/59b21162a2c4645c64271ca004c7a3755a3d72fb/ts_src/bufferutils.ts#L26
      buffer.writeUInt32LE(txOut.value.modulo(new BigNumber(0x100000000)).toNumber(), bufferOffset);
      buffer.writeUInt32LE(
        txOut.value.dividedToIntegerBy(new BigNumber(0x100000000)).toNumber(),
        bufferOffset + 4,
      );
      bufferOffset += 8;
      if (additionals && additionals.includes("decred")) {
        bufferOffset = utils.writeVarInt(buffer, 0, bufferOffset);
        bufferOffset = utils.writeVarInt(buffer, 0, bufferOffset);
      }
      bufferOffset = utils.writeVarInt(buffer, txOut.script.length, bufferOffset);
      bufferOffset += txOut.script.copy(buffer, bufferOffset);
    });

    const outputScriptHex = buffer.toString("hex");
    const associatedKeysets = txInfo.associatedDerivations.map(
      ([account, index]) =>
        `${fromAccount.params.path}/${fromAccount.params.index}'/${account}/${index}`,
    );

    type Inputs = [Transaction, number, string | null | undefined, number | null | undefined][];
    const inputs: Inputs = orderedInputs.map(i => {
      if (additionals && additionals.includes("peercoin")) {
        // remove timestamp for new version of peercoin input, refer to https://github.com/peercoin/rfcs/issues/5 and https://github.com/LedgerHQ/ledgerjs/issues/701
        const version = i.txHex.substring(0, 8);
        hasTimestamp = version === "01000000" || version === "02000000";
      }
      log("hw", `splitTransaction`, {
        transactionHex: i.txHex,
        isSegwitSupported: true,
        hasTimestamp,
        hasExtraData,
        additionals,
      });
      return [
        btc.splitTransaction(i.txHex, true, hasTimestamp, hasExtraData, additionals),
        i.output_index,
        null,
        i.sequence,
      ];
    });

    const lastOutputIndex = txInfo.outputs.length - 1;

    log("hw", `createPaymentTransaction`, {
      inputs,
      associatedKeysets,
      outputScriptHex,
      ...(params.lockTime && { lockTime: params.lockTime }),
      ...(params.sigHashType && { sigHashType: params.sigHashType }),
      ...(params.segwit && { segwit: params.segwit }),
      initialTimestamp,
      ...(params.expiryHeight && { expiryHeight: params.expiryHeight }),
      ...(txInfo.outputs[lastOutputIndex]?.isChange && {
        changePath: `${fromAccount.params.path}/${fromAccount.params.index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
      }),
      additionals: additionals || [],
    });

    /**
     * The arguments are passed to this function with this weird destructuring syntax
     * because providing these params as `undefined` seem to cause some errors with
     * the BtcOld `createPaymentTransaction` implementation, and it is
     * required to not provide them instead...
     * cf.: libs/ledgerjs/packages/hw-app-btc/src/BtcOld.ts
     */
    const tx = await btc.createPaymentTransaction({
      inputs,
      associatedKeysets,
      outputScriptHex,
      ...(params.lockTime && { lockTime: params.lockTime }),
      ...(params.sigHashType && { sigHashType: params.sigHashType }),
      ...(params.segwit && { segwit: params.segwit }),
      initialTimestamp,
      ...(params.expiryHeight && { expiryHeight: params.expiryHeight }),
      ...(txInfo.outputs[lastOutputIndex]?.isChange && {
        changePath: `${fromAccount.params.path}/${fromAccount.params.index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
      }),
      additionals: additionals || [],
      onDeviceSignatureRequested,
      onDeviceSignatureGranted,
      onDeviceStreaming,
    });

    return tx;
  }

  async broadcastTx(fromAccount: Account, tx: string): Promise<string> {
    const res = await fromAccount.xpub.broadcastTx(tx);
    return res.data.result;
  }

  instantiateXpubFromSerializedAccount(account: SerializedAccount): Xpub {
    const currencyId = account.params.currency;
    const cryptoCurrency = getCryptoCurrencyById(currencyId);
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

  async importFromSerializedAccount(account: SerializedAccount): Promise<Account> {
    const xpub = this.instantiateXpubFromSerializedAccount(account);

    await xpub.storage.load(account.xpub.data);

    return {
      ...account,
      xpub,
    };
  }

  importFromSerializedAccountSync(account: SerializedAccount): Account {
    const xpub = this.instantiateXpubFromSerializedAccount(account);

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
