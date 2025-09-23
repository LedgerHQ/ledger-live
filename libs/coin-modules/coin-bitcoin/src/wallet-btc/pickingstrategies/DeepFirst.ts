import BigNumber from "bignumber.js";
import flatten from "lodash/flatten";
import sortBy from "lodash/sortBy";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import { PickingStrategy } from "./types";
import * as utils from "../utils";
import { log } from "@ledgerhq/logs";
import { OutputInfo } from "..";

/**
 * prioritizes the oldest UTXOs in the current transaction
 */
export class DeepFirst extends PickingStrategy {
  async selectUnspentUtxosToUse(
    xpub: Xpub,
    outputs: OutputInfo[],
    feePerByte: number,
  ): Promise<{
    unspentUtxos: Output[];
    totalValue: BigNumber;
    fee: number;
    needChangeoutput: boolean;
  }> {
    // get the utxos to use as input
    // from all addresses of the account
    const addresses = await xpub.getXpubAddresses();
    log("picking strategy", "Deepfirst");

    let unspentUtxos = flatten(
      await Promise.all(addresses.map(address => xpub.storage.getAddressUnspentUtxos(address))),
    ).filter(
      o =>
        !this.excludedUTXOs.filter(
          x => x.hash === o.output_hash && x.outputIndex === o.output_index,
        ).length,
    );

    // OLD:  const outputScripts = outputs.map(o => o.script);
    const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));
    const outputScripts = outputs.map(o => o.script);

    unspentUtxos = sortBy(unspentUtxos, "block_height");
    // https://metamug.com/article/security/bitcoin-transaction-fee-satoshi-per-byte.html
    // const txSizeNoInput = utils.maxTxSize(
    const baseVNoInput = utils.maxTxVBytesCeil(
      0,
      outputScripts,
      false,
      this.crypto,
      this.derivationMode,
    );
    // let fee = txSizeNoInput * feePerByte;
    // const emptyTxSize = utils.maxTxSizeCeil(0, [], false, this.crypto, this.derivationMode);
    // const sizePerInput =
    //   utils.maxTxSize(1, [], false, this.crypto, this.derivationMode) - emptyTxSize;
    //
    // const sizePerOutput =
    //   (outputScripts[0]
    //     ? utils.maxTxSize(0, [outputScripts[0]], false, this.crypto, this.derivationMode)
    //     : utils.maxTxSize(0, [], true, this.crypto, this.derivationMode)) - emptyTxSize;
    let fee = baseVNoInput * safeFeePerByte;
    const emptyTxV = utils.maxTxVBytesCeil(0, [], false, this.crypto, this.derivationMode);
    const perInputV =
      utils.maxTxVBytesCeil(1, [], false, this.crypto, this.derivationMode) - emptyTxV;
    const changeDeltaV =
      utils.maxTxVBytesCeil(0, [], true, this.crypto, this.derivationMode) - emptyTxV;

    let total = new BigNumber(0);
    const unspentUtxoSelected: Output[] = [];

    const amount = outputs.reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
    let i = 0;
    while (total.lt(amount.plus(fee))) {
      if (!unspentUtxos[i]) {
        throw new NotEnoughBalance();
      }
      total = total.plus(unspentUtxos[i].value);
      unspentUtxoSelected.push(unspentUtxos[i]);
      // fee += sizePerInput * feePerByte;
      fee += perInputV * safeFeePerByte;
      i += 1;
    }

    // if (total.minus(amount.plus(fee)).lt(sizePerOutput * feePerByte)) {
    if (total.minus(amount.plus(fee)).lt(changeDeltaV * safeFeePerByte)) {
      // not enough fund to make a change output
      return {
        totalValue: total,
        unspentUtxos: unspentUtxoSelected,
        fee: Math.ceil(fee),
        needChangeoutput: false,
      };
    }
    // fee += sizePerOutput * feePerByte; // fee to make a change output
    fee += changeDeltaV * safeFeePerByte; // add change output cost
    return {
      totalValue: total,
      unspentUtxos: unspentUtxoSelected,
      fee: Math.ceil(fee),
      needChangeoutput: true,
    };
  }
}
