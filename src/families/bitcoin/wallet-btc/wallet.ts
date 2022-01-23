// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { flatten } from "lodash";
import BigNumber from "bignumber.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { BufferWriter } from "bitcoinjs-lib/src/bufferutils";

import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { Transaction } from "@ledgerhq/hw-app-btc/lib/types";
import { Currency } from "./crypto/types";

import { TransactionInfo, DerivationModes } from "./types";
import { Account, SerializedAccount } from "./account";
import Xpub from "./xpub";
import { IExplorer } from "./explorer/types";
import BitcoinLikeExplorer from "./explorer";
import { IStorage } from "./storage/types";
import BitcoinLikeStorage from "./storage";
import { PickingStrategy } from "./pickingstrategies/types";
import * as utils from "./utils";
import cryptoFactory from "./crypto/factory";

class BitcoinLikeWallet {
  explorerInstances: { [key: string]: IExplorer } = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  explorers: { [key: string]: (explorerURI: string) => IExplorer } = {
    ledgerv3: (explorerURI) =>
      new BitcoinLikeExplorer({
        explorerURI,
        explorerVersion: "v3",
      }),
    ledgerv2: (explorerURI) =>
      new BitcoinLikeExplorer({
        explorerURI,
        explorerVersion: "v2",
      }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accountStorages: { [key: string]: (...args: any[]) => IStorage } = {
    mock: () => new BitcoinLikeStorage(),
  };

  getExplorer(explorer: "ledgerv3" | "ledgerv2", explorerURI: string) {
    const id = `explorer-${explorer}-uri-${explorerURI}`;
    this.explorerInstances[id] =
      this.explorerInstances[id] || this.explorers[explorer](explorerURI);
    return this.explorerInstances[id];
  }

  async generateAccount(params: {
    xpub: string;
    path: string;
    index: number;
    currency: Currency;
    network: "mainnet" | "testnet";
    derivationMode: DerivationModes;
    explorer: "ledgerv3" | "ledgerv2";
    explorerURI: string;
    storage: "mock";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageParams: any[];
  }): Promise<Account> {
    const crypto = cryptoFactory(params.currency);

    const storage = this.accountStorages[params.storage](
      ...params.storageParams
    );
    const explorer = this.getExplorer(params.explorer, params.explorerURI);
    return {
      params,
      xpub: new Xpub({
        storage,
        explorer,
        crypto,
        xpub: params.xpub,
        derivationMode: params.derivationMode,
      }),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async syncAccount(account: Account) {
    return account.xpub.sync();
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountNewReceiveAddress(account: Account) {
    const address = await account.xpub.getNewAddress(0, 1);
    return address;
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountNewChangeAddress(account: Account) {
    const address = await account.xpub.getNewAddress(1, 1);
    return address;
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountTransactions(account: Account) {
    const txs = await account.xpub.storage.export();
    return txs;
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountUnspentUtxos(account: Account) {
    const addresses = await account.xpub.getXpubAddresses();
    return flatten(
      await Promise.all(
        addresses.map((address) =>
          account.xpub.storage.getAddressUnspentUtxos(address)
        )
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async estimateAccountMaxSpendable(
    account: Account,
    feePerByte: number,
    excludeUTXOs: Array<{ hash: string; outputIndex: number }>,
    pickUnconfirmedRBF: boolean,
    outputAddresses: string[] = []
  ) {
    const addresses = await account.xpub.getXpubAddresses();
    const utxos = flatten(
      await Promise.all(
        addresses.map((address) =>
          account.xpub.storage.getAddressUnspentUtxos(address)
        )
      )
    );
    let balance = new BigNumber(0);
    log("btcwallet", "estimateAccountMaxSpendable utxos", utxos);
    let usableUtxoCount = 0;
    utxos.forEach((utxo) => {
      if (
        !excludeUTXOs.find(
          (excludeUtxo) =>
            excludeUtxo.hash === utxo.output_hash &&
            excludeUtxo.outputIndex === utxo.output_index
        )
      ) {
        if ((pickUnconfirmedRBF && utxo.rbf) || utxo.block_height !== null) {
          usableUtxoCount++;
          balance = balance.plus(utxo.value);
        }
      }
    });
    // fees if we use all utxo
    const fees =
      feePerByte *
      utils.maxTxSizeCeil(
        usableUtxoCount,
        outputAddresses,
        outputAddresses.length == 0,
        account.xpub.crypto,
        account.xpub.derivationMode
      );

    log("btcwallet", "estimateAccountMaxSpendable balance", balance);
    log("btcwallet", "estimateAccountMaxSpendable fees", fees);
    const maxSpendable = balance.minus(fees);
    return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountBalance(account: Account) {
    const balance = await account.xpub.getXpubBalance();
    return balance;
  }

  // eslint-disable-next-line class-methods-use-this
  async getAccountPendings(account: Account) {
    const addresses = await account.xpub.getXpubAddresses();
    return flatten(
      await Promise.all(
        addresses.map((address) => account.xpub.explorer.getPendings(address))
      )
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async buildAccountTx(params: {
    fromAccount: Account;
    dest: string;
    amount: BigNumber;
    feePerByte: number;
    utxoPickingStrategy: PickingStrategy;
    sequence: number;
  }): Promise<TransactionInfo> {
    const changeAddress = await params.fromAccount.xpub.getNewAddress(1, 1);
    const txInfo = await params.fromAccount.xpub.buildTx({
      destAddress: params.dest,
      amount: params.amount,
      feePerByte: params.feePerByte,
      changeAddress,
      utxoPickingStrategy: params.utxoPickingStrategy,
      sequence: params.sequence,
    });
    return txInfo;
  }

  // eslint-disable-next-line class-methods-use-this
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
    onDeviceStreaming?: (arg0: {
      progress: number;
      total: number;
      index: number;
    }) => void;
  }) {
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
    let hasTimestamp = params.hasTimestamp;
    let length = txInfo.outputs.reduce((sum, output) => {
      return sum + 8 + output.script.length + 1;
    }, 1);
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L478
    // Decred has a witness and an expiry height
    if (additionals && additionals.includes("decred")) {
      length += 2 * txInfo.outputs.length;
    }
    const buffer = Buffer.allocUnsafe(length);
    const bufferWriter = new BufferWriter(buffer, 0);
    bufferWriter.writeVarInt(txInfo.outputs.length);
    txInfo.outputs.forEach((txOut) => {
      // xpub splits output into smaller outputs than SAFE_MAX_INT anyway
      bufferWriter.writeUInt64(txOut.value.toNumber());
      if (additionals && additionals.includes("decred")) {
        bufferWriter.writeVarInt(0);
        bufferWriter.writeVarInt(0);
      }
      bufferWriter.writeVarSlice(txOut.script);
    });
    const outputScriptHex = buffer.toString("hex");
    const associatedKeysets = txInfo.associatedDerivations.map(
      ([account, index]) =>
        `${fromAccount.params.path}/${fromAccount.params.index}'/${account}/${index}`
    );
    type Inputs = [
      Transaction,
      number,
      string | null | undefined,
      number | null | undefined
    ][];
    const inputs: Inputs = txInfo.inputs.map((i) => {
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
        btc.splitTransaction(
          i.txHex,
          true,
          hasTimestamp,
          hasExtraData,
          additionals
        ),
        i.output_index,
        null,
        i.sequence,
      ];
    });

    const lastOutputIndex = txInfo.outputs.length - 1;

    log("hw", `createPaymentTransactionNew`, {
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

    const tx = await btc.createPaymentTransactionNew({
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

  // eslint-disable-next-line class-methods-use-this
  async broadcastTx(fromAccount: Account, tx: string) {
    const res = await fromAccount.xpub.broadcastTx(tx);
    return res.data.result;
  }

  instantiateXpubFromSerializedAccount(account: SerializedAccount): Xpub {
    const crypto = cryptoFactory(account.params.currency);
    const storage = this.accountStorages[account.params.storage](
      ...account.params.storageParams
    );
    const explorer = this.getExplorer(
      account.params.explorer,
      account.params.explorerURI
    );

    return new Xpub({
      storage,
      explorer,
      crypto,
      xpub: account.xpub.xpub,
      derivationMode: account.params.derivationMode,
    });
  }

  async importFromSerializedAccount(
    account: SerializedAccount
  ): Promise<Account> {
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

  // eslint-disable-next-line class-methods-use-this
  async exportToSerializedAccount(
    account: Account
  ): Promise<SerializedAccount> {
    const data = await account.xpub.storage.export();

    return {
      ...account,
      xpub: {
        xpub: account.xpub.xpub,
        data,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
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
