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
 * prioritize using UTXOs with smaller denominations
 */
export class Merge extends PickingStrategy {
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
    log("picking strategy", "Merge");
    let unspentUtxos = flatten(
      await Promise.all(addresses.map(address => xpub.storage.getAddressUnspentUtxos(address))),
    ).filter(
      o =>
        !this.excludedUTXOs.filter(
          x => x.hash === o.output_hash && x.outputIndex === o.output_index,
        ).length,
    );

    // Validate UTXOs: only keep those for which we can fetch the transaction hex
    const txHexResults = await Promise.allSettled(
      unspentUtxos.map(u => xpub.explorer.getTxHex(u.output_hash)),
    );
    unspentUtxos = unspentUtxos.filter((_, i) => txHexResults[i].status === "fulfilled");

    // NOTE: clamping at this level, might remove...?
    const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));
    const outputScripts = outputs.map(o => o.script);
    // integer vbytes everywhere
    const emptyTxV = utils.maxTxVBytesCeil(0, [], false, this.crypto, this.derivationMode);
    const perInputV =
      utils.maxTxVBytesCeil(1, [], false, this.crypto, this.derivationMode) - emptyTxV;
    // delta for adding a *change* output (same derivation as inputs)
    const changeDeltaV =
      utils.maxTxVBytesCeil(0, [], true, this.crypto, this.derivationMode) - emptyTxV;

    unspentUtxos = sortBy(unspentUtxos, utxo => parseInt(utxo.value, 10));
    // base vbytes for outputs only (no inputs)
    const baseVNoInput = utils.maxTxVBytesCeil(
      0,
      outputScripts,
      false,
      this.crypto,
      this.derivationMode,
    );
    let fee = baseVNoInput * safeFeePerByte;
    let total = new BigNumber(0);
    const unspentUtxoSelected: Output[] = [];

    let i = 0;
    const amount = outputs.reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
    while (total.lt(amount.plus(fee))) {
      if (!unspentUtxos[i]) {
        throw new NotEnoughBalance();
      }
      total = total.plus(unspentUtxos[i].value);
      unspentUtxoSelected.push(unspentUtxos[i]);
      fee += perInputV * safeFeePerByte;
      i += 1;
    }

    // If we can't afford to add the change output, drop it
    if (total.minus(amount.plus(fee)).lt(changeDeltaV * safeFeePerByte)) {
      // not enough fund to make a change output
      return {
        totalValue: total,
        unspentUtxos: unspentUtxoSelected,
        fee: Math.ceil(fee),
        needChangeoutput: false,
      };
    }
    fee += changeDeltaV * safeFeePerByte; // add change output cost
    return {
      totalValue: total,
      unspentUtxos: unspentUtxoSelected,
      fee: Math.ceil(fee),
      needChangeoutput: true,
    };
  }
}
