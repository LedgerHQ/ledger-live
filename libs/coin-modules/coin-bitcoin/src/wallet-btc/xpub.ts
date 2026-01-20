import type { BroadcastConfig } from "@ledgerhq/types-live";
import maxBy from "lodash/maxBy";
import range from "lodash/range";
import some from "lodash/some";
import BigNumber from "bignumber.js";
import { TX, Address, IStorage } from "./storage/types";
import { IExplorer } from "./explorer/types";
import { ICrypto } from "./crypto/types";
import { PickingStrategy } from "./pickingstrategies/types";
import {
  computeDustAmount,
  maxTxSizeCeil,
  getIncrementalFeeFloorSatVb,
  scriptToAddress,
} from "./utils";
import { TransactionInfo, InputInfo, OutputInfo } from "./types";
import { Transaction } from "bitcoinjs-lib";

// names inside this class and discovery logic respect BIP32 standard
class Xpub {
  storage: IStorage;

  explorer: IExplorer;

  crypto: ICrypto;

  xpub: string;

  derivationMode: string;

  freshAddress: string;

  freshAddressIndex: number;

  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/27a840aac4a12338f1e40c54f3759bbd7a559944/src/bufferutils.js#L24
  // only works with number so we need to be sure to pass correct numbers
  OUTPUT_VALUE_MAX: number = Number.MAX_SAFE_INTEGER;

  GAP = 20;

  // need to be bigger than the number of tx from the same address that can be in the same block
  txsSyncArraySize = 1000;

  // the height of the block during the previous synchronization. We do not need to repeatedly synchronize blocks lower than this height.
  // -1 means that this account has not been synchronized
  syncedBlockHeight = -1;

  // the height of the current block in blockchain
  currentBlockHeight: number | undefined = undefined;

  constructor({
    storage,
    explorer,
    crypto,
    xpub,
    derivationMode,
  }: {
    storage: IStorage;
    explorer: IExplorer;
    crypto: ICrypto;
    xpub: string;
    derivationMode: string;
  }) {
    this.storage = storage;
    this.explorer = explorer;
    this.crypto = crypto;
    this.xpub = xpub;
    this.derivationMode = derivationMode;
    this.freshAddress = "";
    this.freshAddressIndex = 0;
  }

  async syncAddress(account: number, index: number, needReorg: boolean): Promise<boolean> {
    const address = await this.crypto.getAddress(this.derivationMode, this.xpub, account, index);

    this.storage.addAddress(
      `${this.crypto.network.name}-${this.derivationMode}-${this.xpub}-${account}-${index}`,
      address,
    );
    if (needReorg) {
      await this.checkAddressReorg(account, index);
    }
    // in case pendings have changed we clean them out
    const hasPendings = this.storage.hasPendingTx({
      account,
      index,
    });
    if (hasPendings) {
      this.storage.removePendingTxs({ account, index });
    }
    await this.fetchHydrateAndStoreNewTxs(address, account, index);
    const hasTx = this.storage.hasTx({
      account,
      index,
    });
    if (account === 0 && hasTx) {
      this.freshAddressIndex = Math.max(this.freshAddressIndex, index + 1);
    }

    return hasTx;
  }

  async checkAddressesBlock(account: number, index: number, needReorg: boolean): Promise<boolean> {
    const addressesResults = await Promise.all(
      range(this.GAP).map((_, key) => this.syncAddress(account, index + key, needReorg)),
    );
    return some(addressesResults, lastTx => !!lastTx);
  }

  async syncAccount(account: number, needReorg: boolean): Promise<number> {
    let index = 0;
    // eslint-disable-next-line no-await-in-loop
    while (await this.checkAddressesBlock(account, index, needReorg)) {
      index += this.GAP;
    }
    return index;
  }

  // TODO : test fail case + incremental
  async sync(): Promise<void> {
    this.freshAddressIndex = 0;
    const highestBlockFromStorage = this.storage.getHighestBlockHeightAndHash();
    let needReorg = !!highestBlockFromStorage;
    if (highestBlockFromStorage) {
      const highestBlockFromExplorer = await this.explorer.getBlockByHeight(
        highestBlockFromStorage.height,
      );
      if (highestBlockFromExplorer?.hash === highestBlockFromStorage.hash) {
        needReorg = false;
      }
    }
    if (needReorg) {
      this.syncedBlockHeight = -1;
    }
    await Promise.all([
      this.syncAccount(0, needReorg), // for receive addresses
      this.syncAccount(1, needReorg), // for change addresses
    ]);
    this.freshAddress = await this.crypto.getAddress(
      this.derivationMode,
      this.xpub,
      0,
      this.freshAddressIndex,
    );
  }

  async getXpubBalance(): Promise<BigNumber> {
    const addresses = await this.getXpubAddresses();
    return this.getAddressesBalance(addresses);
  }

  async getAccountBalance(account: number): Promise<BigNumber> {
    const addresses = await this.getAccountAddresses(account);
    return this.getAddressesBalance(addresses);
  }

  async getAddressBalance(address: Address): Promise<BigNumber> {
    const unspentUtxos = this.storage.getAddressUnspentUtxos(address);
    return unspentUtxos.reduce((total, { value }) => total.plus(value), new BigNumber(0));
  }

  async getXpubAddresses(): Promise<Address[]> {
    return this.storage.getUniquesAddresses({});
  }

  async getAccountAddresses(account: number): Promise<Address[]> {
    return this.storage.getUniquesAddresses({ account });
  }

  async getNewAddress(account: number, gap: number): Promise<Address> {
    const accountAddresses = await this.getAccountAddresses(account);
    const lastIndex = (maxBy(accountAddresses, "index") || { index: -1 }).index;
    let index: number;
    if (lastIndex === -1) {
      index = 0;
    } else {
      index = lastIndex + gap;
    }
    const address: Address = {
      address: await this.crypto.getAddress(this.derivationMode, this.xpub, account, index),
      account,
      index,
    };

    return address;
  }

  async buildTx(params: {
    destAddress: string;
    amount: BigNumber;
    feePerByte: number;
    changeAddress: Address;
    utxoPickingStrategy: PickingStrategy;
    sequence: number;
    opReturnData?: Buffer | undefined;
    originalTxId?: string | undefined;
    /** For RBF: minimum total fee (sats) so replacement pays more than original (avoids "less fees than conflicting" reject) */
    minReplacementFeeSat?: number | undefined;
  }): Promise<TransactionInfo> {
    const outputs: OutputInfo[] = [];

    const {
      amount,
      opReturnData,
      destAddress,
      changeAddress,
      utxoPickingStrategy,
      feePerByte,
      sequence,
      originalTxId,
      minReplacementFeeSat,
    } = params;

    if (opReturnData) {
      const opReturnOutput: OutputInfo = {
        script: this.crypto.toOpReturnOutputScript(opReturnData),
        value: new BigNumber(0),
        address: null,
        isChange: false,
      };

      outputs.push(opReturnOutput);
    }

    // outputs splitting
    // btc only support value fitting in uint64 and the lib
    // we use to serialize output only take js number in params
    // that are actually even more restricted
    const desiredOutputLeftToFit: OutputInfo = {
      script: this.crypto.toOutputScript(destAddress),
      value: amount,
      address: destAddress,
      isChange: false,
    };

    while (desiredOutputLeftToFit.value.gt(this.OUTPUT_VALUE_MAX)) {
      outputs.push({
        script: desiredOutputLeftToFit.script,
        value: new BigNumber(this.OUTPUT_VALUE_MAX),
        address: destAddress,
        isChange: false,
      });

      desiredOutputLeftToFit.value = desiredOutputLeftToFit.value.minus(this.OUTPUT_VALUE_MAX);
    }

    if (desiredOutputLeftToFit.value.gt(0)) {
      outputs.push(desiredOutputLeftToFit);
    }

    let inputs: InputInfo[];
    let associatedDerivations: [number, number][];
    let total: BigNumber;
    let fee: number;
    let needChangeoutput: boolean;

    if (originalTxId) {
      try {
        // For RBF (speed up / cancel) transactions, we need to keep the same inputs as the original transaction
        const originalTx = await this.explorer.getTxHex(originalTxId);

        const originalTxObj = Transaction.fromHex(originalTx);

        // Build inputs and their associated derivations from the original transaction
        const inputsWithDerivations = await Promise.all(
          originalTxObj.ins.map(async input => {
            const prevTxId = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");

            const prevTxHex = await this.explorer.getTxHex(prevTxId);
            const prevTx = Transaction.fromHex(prevTxHex);

            const prevOut = prevTx.outs[input.index];
            if (!prevOut) {
              throw new Error("Previous output not found");
            }

            const address = scriptToAddress(prevOut.script, this.crypto.network);

            // Look up the derivation path for this address from storage
            const storedTx = this.storage.getTx(address, prevTxId);
            const derivation: [number, number] = storedTx
              ? [storedTx.account || 0, storedTx.index || 0]
              : [0, 0]; // Fallback if not found

            return {
              input: {
                txHex: prevTxHex,
                value: prevOut.value.toString(),
                address,
                output_hash: prevTxId,
                output_index: input.index,
                sequence: input.sequence,
                block_height: null,
              } as InputInfo,
              derivation,
            };
          }),
        );

        inputs = inputsWithDerivations.map(item => item.input);
        associatedDerivations = inputsWithDerivations.map(item => item.derivation);

        // Calculate total from actual inputs for RBF
        total = inputs.reduce((sum, inp) => sum.plus(new BigNumber(inp.value)), new BigNumber(0));

        // For RBF, fee must be at least (estimatedSize * feePerByte) AND at least minReplacementFeeSat
        // so that total fee is strictly greater than the original (replacement can be smaller vsize)
        const estimatedTxSize = maxTxSizeCeil(
          inputs.length,
          outputs.map(o => o.script),
          true,
          this.crypto,
          this.derivationMode,
        );
        const feeFromRate = estimatedTxSize * feePerByte;
        fee =
          typeof minReplacementFeeSat === "number"
            ? Math.max(feeFromRate, minReplacementFeeSat)
            : feeFromRate;
        needChangeoutput = true;
      } catch (error) {
        throw new Error("Failed to build RBF transaction: " + error);
      }
    } else {
      // now we select only the output needed to cover the amount + fee
      const result = await utxoPickingStrategy.selectUnspentUtxosToUse(this, outputs, feePerByte);

      const unspentUtxoSelected = result.unspentUtxos;
      fee = result.fee;
      needChangeoutput = result.needChangeoutput;

      // Fetch transaction hex for selected UTXOs, handling failures gracefully
      const txHexResults = await Promise.all(
        unspentUtxoSelected.map(unspentUtxo => this.explorer.getTxHex(unspentUtxo.output_hash)),
      );

      // Recalculate total based on what we actually got
      total = unspentUtxoSelected.reduce(
        (sum, utxo) => sum.plus(new BigNumber(utxo.value)),
        new BigNumber(0),
      );

      const txs = await Promise.all(
        unspentUtxoSelected.map(unspentUtxo =>
          this.storage.getTx(unspentUtxo.address, unspentUtxo.output_hash),
        ),
      );

      inputs = unspentUtxoSelected.map((utxo, index) => {
        return {
          txHex: txHexResults[index],
          value: utxo.value,
          address: utxo.address,
          output_hash: utxo.output_hash,
          output_index: utxo.output_index,
          sequence,
          block_height: utxo.block_height || null,
        };
      });

      associatedDerivations = unspentUtxoSelected.map((_utxo, index) => {
        if (!txs[index]) {
          throw new Error("Invalid index in txs[index]");
        }
        return [txs[index]?.account || 0, txs[index]?.index || 0];
      });
    }

    const txSize = maxTxSizeCeil(
      inputs.length,
      outputs.map(o => o.script),
      true,
      this.crypto,
      this.derivationMode,
    );

    const dustLimit = computeDustAmount(this.crypto, txSize);

    // Abandon the change output if change output amount is less than dust amount
    if (needChangeoutput && total.minus(amount).minus(fee).gt(dustLimit)) {
      outputs.push({
        script: this.crypto.toOutputScript(changeAddress.address),
        value: total.minus(amount).minus(fee),
        address: changeAddress.address,
        isChange: true,
      });
    }

    const outputsValue: BigNumber = outputs.reduce((cur, o) => cur.plus(o.value), new BigNumber(0));
    const actualFee = total.minus(outputsValue).toNumber();
    // For RBF transactions, validate that the absolute fee increase meets the minimum requirements
    if (originalTxId) {
      try {
        const originalTxHex = await this.explorer.getTxHex(originalTxId);
        const originalTxObj = Transaction.fromHex(originalTxHex);

        // Calculate original transaction's fee
        const originalInputValues = await Promise.all(
          originalTxObj.ins.map(async input => {
            const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
            const prevTxHex = await this.explorer.getTxHex(txid);
            const prevTx = Transaction.fromHex(prevTxHex);
            return prevTx.outs[input.index].value;
          }),
        );
        const originalTotalInput = originalInputValues.reduce((a, b) => a + b, 0);
        const originalTotalOutput = originalTxObj.outs.reduce((a, o) => a + o.value, 0);
        const originalFee = originalTotalInput - originalTotalOutput;

        const incrementalFeeRateSatVb = await getIncrementalFeeFloorSatVb(this.explorer);
        const originalVsize = originalTxObj.virtualSize();
        const minAbsoluteFeeIncrease = incrementalFeeRateSatVb
          .times(originalVsize)
          .integerValue(BigNumber.ROUND_CEIL)
          .toNumber();

        const actualFeeIncrease = actualFee - originalFee;

        if (actualFeeIncrease < minAbsoluteFeeIncrease) {
          // We need to increase the fee by reducing the change output
          const additionalFeeNeeded = minAbsoluteFeeIncrease - actualFeeIncrease;
          const changeOutput = outputs.find(o => o.isChange);
          if (!changeOutput) {
            throw new Error(
              `RBF requires an additional ${additionalFeeNeeded} sats fee increase but there is no change output to reduce (e.g. send-max). Cannot build a valid replacement.`,
            );
          }
          const newChangeValue = changeOutput.value.minus(additionalFeeNeeded);
          if (newChangeValue.lt(dustLimit)) {
            const changeIndex = outputs.indexOf(changeOutput);
            outputs.splice(changeIndex, 1);
          } else {
            changeOutput.value = newChangeValue;
          }
        }
      } catch (error) {
        throw new Error("Failed to build RBF transaction: " + error);
      }
    }
    const result = {
      inputs,
      associatedDerivations,
      outputs,
      fee: total.minus(outputs.reduce((cur, o) => cur.plus(o.value), new BigNumber(0))).toNumber(),
      changeAddress: changeAddress,
    };
    return result;
  }

  async broadcastTx(
    rawTxHex: string,
    broadcastConfig?: Pick<BroadcastConfig, "source">,
  ): Promise<{ data: { result: string } }> {
    return this.explorer.broadcast(rawTxHex, broadcastConfig);
  }

  // internal
  async getAddressesBalance(addresses: Address[]): Promise<BigNumber> {
    const balances = await Promise.all(addresses.map(address => this.getAddressBalance(address)));

    return balances.reduce((total, balance) => total.plus(balance), new BigNumber(0));
  }

  async fetchHydrateAndStoreNewTxs(
    address: string,
    account: number,
    index: number,
  ): Promise<number> {
    let pendingTxs: TX[] = [];
    let txs: TX[] = [];
    let inserted = 0;
    let lastTxBlockheight =
      this.storage.getLastConfirmedTxBlock({
        account,
        index,
      })?.height || -1;
    lastTxBlockheight = Math.max(lastTxBlockheight, this.syncedBlockHeight);
    let token: string | null = null;
    do {
      if (token) {
        // if there is a token it means it's not the first page, we need to fetch only non-pending txs. There is no pagination for pending txs
        const result = await this.explorer.getTxsSinceBlockheight(
          this.txsSyncArraySize,
          { address, account, index },
          lastTxBlockheight + 1,
          this.currentBlockHeight,
          false,
          token,
        );
        txs = result.txs;
        token = result.nextPageToken;
        inserted += this.storage.appendTxs(txs); // insert not pending tx
      } else {
        // if there is no token it means it's the first page, we need to fetch pending txs and non-pending txs
        const [pendingResult, txsResult]: [
          { txs: TX[]; nextPageToken: string | null },
          { txs: TX[]; nextPageToken: string | null },
        ] = await Promise.all([
          this.explorer.getTxsSinceBlockheight(
            this.txsSyncArraySize,
            { address, account, index },
            0,
            this.currentBlockHeight,
            true,
            token,
          ),
          this.explorer.getTxsSinceBlockheight(
            this.txsSyncArraySize,
            { address, account, index },
            lastTxBlockheight + 1,
            this.currentBlockHeight,
            false,
            token,
          ),
        ]);
        pendingTxs = pendingResult.txs;
        txs = txsResult.txs;
        token = txsResult.nextPageToken;
        inserted += this.storage.appendTxs(txs); // insert not pending tx
      }
    } while (token); // loop until no more txs, if there is a token it means there is more txs to fetch
    inserted += this.storage.appendTxs(pendingTxs); // insert pending tx
    return inserted;
  }

  async checkAddressReorg(account: number, index: number): Promise<void> {
    const lastConfirmedTxBlock = this.storage.getLastConfirmedTxBlock({
      account,
      index,
    });

    if (!lastConfirmedTxBlock) {
      return;
    }

    const block = await this.explorer.getBlockByHeight(lastConfirmedTxBlock.height);

    // all good the block is valid
    if (block && block.hash === lastConfirmedTxBlock.hash) {
      return;
    }

    // in this case the block is not valid so we delete everything
    // for that address
    // TODO: delete only everything for this (address, block)
    // but need to think if its possible with current storage implem

    this.storage.removeTxs({
      account,
      index,
    });
  }
}

export default Xpub;
