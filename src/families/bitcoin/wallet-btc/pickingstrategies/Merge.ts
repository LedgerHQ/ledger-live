import BigNumber from "bignumber.js";
import { flatten, sortBy } from "lodash";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import { PickingStrategy } from "./types";
import * as utils from "../utils";
import { log } from "@ledgerhq/logs";

export class Merge extends PickingStrategy {
  // eslint-disable-next-line class-methods-use-this
  async selectUnspentUtxosToUse(
    xpub: Xpub,
    amount: BigNumber,
    feePerByte: number,
    nbOutputsWithoutChange: number
  ) {
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

    const sizePerInput =
      utils.estimateTxSize(1, 0, this.crypto, this.derivationMode) -
      utils.estimateTxSize(0, 0, this.crypto, this.derivationMode);

    const sizePerOutput =
      utils.estimateTxSize(0, 1, this.crypto, this.derivationMode) -
      utils.estimateTxSize(0, 0, this.crypto, this.derivationMode);

    unspentUtxos = sortBy(unspentUtxos, (utxo) => parseInt(utxo.value, 10));
    // https://metamug.com/article/security/bitcoin-transaction-fee-satoshi-per-byte.html
    const txSizeNoInput = utils.estimateTxSize(
      0,
      nbOutputsWithoutChange,
      this.crypto,
      this.derivationMode
    );
    let fee = txSizeNoInput * feePerByte;

    let total = new BigNumber(0);
    const unspentUtxoSelected: Output[] = [];

    let i = 0;
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
