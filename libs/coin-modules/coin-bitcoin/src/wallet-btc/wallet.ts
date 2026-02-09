import flatten from "lodash/flatten";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { BroadcastConfig } from "@ledgerhq/types-live";

import { Currency } from "./crypto/types";
import { TransactionInfo, DerivationModes } from "./types";
import { Account, SerializedAccount } from "./account";
import Xpub from "./xpub";
import { IExplorer } from "./explorer/types";
import BitcoinLikeStorage from "./storage";
import { PickingStrategy } from "./pickingstrategies/types";
import * as utils from "./utils";
import cryptoFactory from "./crypto/factory";
import BitcoinLikeExplorer from "./explorer";
import { TX, Address, Output } from "./storage/types";
import { blockchainBaseURL } from "../explorer";
import { getMinReplacementFeeSat, getTxInputOutpoints } from "../rbfHelpers";
import { BitcoinSigner, SignerTransaction } from "../signer";

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

  async buildAccountTx(params: {
    fromAccount: Account;
    dest: string;
    amount: BigNumber;
    feePerByte: number;
    utxoPickingStrategy: PickingStrategy;
    sequence: number;
    opReturnData?: Buffer | undefined;
    changeAddress?: string | undefined;
    originalTxId?: string | undefined;
    /** Pending operations (hash + extra.inputs) to detect conflicting txs; when set with originalTxId, min fee is max over all conflicting */
    pendingOperations?: Array<{ hash: string; extra?: { inputs?: string[] } }> | undefined;
  }): Promise<TransactionInfo> {
    const changeAddress = await params.fromAccount.xpub.getNewAddress(1, 1);
    if (params.changeAddress && params.changeAddress !== changeAddress.address) {
      throw new Error("Invalid change address");
    }

    let minReplacementFeeSat: number | undefined;
    if (params.originalTxId) {
      const replaceTxId = params.originalTxId;
      const inputOutpoints = await getTxInputOutpoints(params.fromAccount, replaceTxId);
      const conflictingTxIds = new Set<string>([replaceTxId]);
      if (params.pendingOperations?.length) {
        for (const op of params.pendingOperations) {
          const opInputs = op.extra?.inputs;
          if (!Array.isArray(opInputs)) continue;
          if (opInputs.some((inp: string) => inputOutpoints.has(inp)))
            conflictingTxIds.add(op.hash);
        }
      }
      let maxMinFee = 0;
      for (const txId of conflictingTxIds) {
        const minFee = await getMinReplacementFeeSat(params.fromAccount, txId);
        const n = minFee.integerValue().toNumber();
        if (n > maxMinFee) maxMinFee = n;
      }
      minReplacementFeeSat = maxMinFee > 0 ? maxMinFee : undefined;
    }

    const txInfo = await params.fromAccount.xpub.buildTx({
      destAddress: params.dest,
      amount: params.amount,
      feePerByte: params.feePerByte,
      changeAddress,
      utxoPickingStrategy: params.utxoPickingStrategy,
      sequence: params.sequence,
      opReturnData: params.opReturnData,
      originalTxId: params.originalTxId,
      minReplacementFeeSat,
    });

    return txInfo;
  }

  async signAccountTx(params: {
    btc: BitcoinSigner;
    fromAccount: Account;
    txInfo: TransactionInfo;
    lockTime?: number | undefined;
    sigHashType?: number | undefined;
    segwit?: boolean | undefined;
    additionals?: Array<string> | undefined;
    expiryHeight?: Buffer | undefined;
    hasExtraData?: boolean | undefined;
    onDeviceSignatureRequested?: () => void;
    onDeviceSignatureGranted?: () => void;
    onDeviceStreaming?: (arg0: { progress: number; total: number; index: number }) => void;
  }): Promise<string> {
    const {
      btc,
      fromAccount,
      txInfo,
      additionals,
      hasExtraData,
      onDeviceSignatureRequested,
      onDeviceSignatureGranted,
      onDeviceStreaming,
    } = params;
    const blockHeight = fromAccount.xpub.currentBlockHeight;
    let length = txInfo.outputs.reduce((sum, output) => {
      return sum + 8 + output.script.length + 1;
    }, 1);
    // refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L478
    // Decred has a witness and an expiry height
    if (additionals && additionals.includes("decred")) {
      length += 2 * txInfo.outputs.length;
    }
    const buffer = Buffer.allocUnsafe(length);
    let bufferOffset = 0;
    bufferOffset = utils.writeVarInt(buffer, txInfo.outputs.length, bufferOffset);
    txInfo.outputs.forEach(txOut => {
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
    type Inputs = [
      SignerTransaction,
      number,
      string | null | undefined,
      number | null | undefined,
      number | null | undefined, // NOTE: blockheight
    ][];
    const inputs: Inputs = txInfo.inputs.map(i => {
      log("hw", `splitTransaction`, {
        transactionHex: i.txHex,
        isSegwitSupported: true,
        hasExtraData,
        additionals,
      });
      return [
        btc.splitTransaction(i.txHex, true, hasExtraData, additionals),
        i.output_index,
        null,
        i.sequence,
        i.block_height,
      ];
    });

    const lastOutputIndex = txInfo.outputs.length - 1;

    log("hw", `createPaymentTransaction`, {
      inputs,
      associatedKeysets,
      outputScriptHex,
      blockHeight,
      ...(params.lockTime && { lockTime: params.lockTime }),
      ...(params.sigHashType && { sigHashType: params.sigHashType }),
      ...(params.segwit && { segwit: params.segwit }),
      ...(params.expiryHeight && { expiryHeight: params.expiryHeight }),
      ...(txInfo.outputs[lastOutputIndex]?.isChange && {
        changePath: `${fromAccount.params.path}/${fromAccount.params.index}'/${txInfo.changeAddress.account}/${txInfo.changeAddress.index}`,
      }),
      additionals: additionals || [],
    });

    const tx = await btc.createPaymentTransaction({
      inputs,
      associatedKeysets,
      outputScriptHex,
      blockHeight,
      ...(params.lockTime && { lockTime: params.lockTime }),
      ...(params.sigHashType && { sigHashType: params.sigHashType }),
      ...(params.segwit && { segwit: params.segwit }),
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

  async broadcastTx(
    fromAccount: Account,
    tx: string,
    broadcastConfig?: Pick<BroadcastConfig, "source">,
  ): Promise<string> {
    const res = await fromAccount.xpub.broadcastTx(tx, broadcastConfig);
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
