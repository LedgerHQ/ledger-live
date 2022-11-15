import BigNumber from "bignumber.js";
import { flatten, sortBy } from "lodash";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import { PickingStrategy } from "./types";
import * as utils from "../utils";
import { log } from "@ledgerhq/logs";
import { OutputInfo } from "..";

export class Merge extends PickingStrategy {
  async selectUnspentUtxosToUse(
    xpub: Xpub,
    outputs: OutputInfo[],
    feePerByte: number
  ): Promise<{
    unspentUtxos: Output[];
    totalValue: BigNumber;
    fee: number;
    needChangeoutput: boolean;
  }> {
    // get the utxos to use as input
    // from all addresses of the account
    const addresses = await xpub.getXpubAddresses();
    log("picking strategy", "Merge");

    let unspentUtxos = flatten(
      await Promise.all(
        addresses.map((address) => xpub.storage.getAddressUnspentUtxos(address))
      )
    ).filter(
      (o) =>
        !this.excludedUTXOs.filter(
          (x) => x.hash === o.output_hash && x.outputIndex === o.output_index
        ).length
    );

    const outputAddresses = outputs.map((o) => o.address);
    const emptyTxSize = utils.maxTxSizeCeil(
      0,
      [],
      false,
      this.crypto,
      this.derivationMode
    );
    const sizePerInput =
      utils.maxTxSize(1, [], false, this.crypto, this.derivationMode) -
      emptyTxSize;

    const sizePerOutput =
      (outputAddresses[0]
        ? utils.maxTxSize(
            0,
            [outputAddresses[0]],
            false,
            this.crypto,
            this.derivationMode
          )
        : utils.maxTxSize(0, [], true, this.crypto, this.derivationMode)) -
      emptyTxSize;

    unspentUtxos = sortBy(unspentUtxos, (utxo) => parseInt(utxo.value, 10));
    // https://metamug.com/article/security/bitcoin-transaction-fee-satoshi-per-byte.html
    const txSizeNoInput = utils.maxTxSize(
      0,
      outputAddresses,
      false,
      this.crypto,
      this.derivationMode
    );
    let fee = txSizeNoInput * feePerByte;

    let total = new BigNumber(0);
    const unspentUtxoSelected: Output[] = [];

    let i = 0;
    const amount = outputs.reduce(
      (sum, output) => sum.plus(output.value),
      new BigNumber(0)
    );
    while (total.lt(amount.plus(fee))) {
      if (!unspentUtxos[i]) {
        throw new NotEnoughBalance();
      }
      total = total.plus(unspentUtxos[i].value);
      unspentUtxoSelected.push(unspentUtxos[i]);
      fee += sizePerInput * feePerByte;
      i += 1;
    }
    if (total.minus(amount.plus(fee)).lt(sizePerOutput * feePerByte)) {
      // not enough fund to make a change output
      return {
        totalValue: total,
        unspentUtxos: unspentUtxoSelected,
        fee: Math.ceil(fee),
        needChangeoutput: false,
      };
    }
    fee += sizePerOutput * feePerByte; // fee to make a change output
    return {
      totalValue: total,
      unspentUtxos: unspentUtxoSelected,
      fee: Math.ceil(fee),
      needChangeoutput: true,
    };
  }
}
