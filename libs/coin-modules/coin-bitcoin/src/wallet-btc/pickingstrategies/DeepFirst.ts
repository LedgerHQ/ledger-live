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

    // Validate UTXOs: only keep those for which we can fetch the transaction hex (avoid selecting unfetchable UTXOs)
    const txHexResults = await Promise.allSettled(
      unspentUtxos.map(u => xpub.explorer.getTxHex(u.output_hash)),
    );
    unspentUtxos = unspentUtxos.filter((_, i) => txHexResults[i].status === "fulfilled");

    const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));
    const outputScripts = outputs.map(o => o.script);

    unspentUtxos = sortBy(unspentUtxos, "block_height");

    let total = new BigNumber(0);
    const unspentUtxoSelected: Output[] = [];
    const amount = outputs.reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
    let i = 0;
    let fee =
      safeFeePerByte *
      utils.maxTxVBytesCeil(0, outputScripts, false, this.crypto, this.derivationMode);
    while (total.lt(amount.plus(fee))) {
      if (!unspentUtxos[i]) {
        throw new NotEnoughBalance();
      }
      total = total.plus(unspentUtxos[i].value);

      unspentUtxoSelected.push(unspentUtxos[i]);
      i += 1;
      fee =
        safeFeePerByte *
        utils.maxTxVBytesCeil(i, outputScripts, false, this.crypto, this.derivationMode);
    }
    const feeWithChange =
      safeFeePerByte *
      utils.maxTxVBytesCeil(i, outputScripts, true, this.crypto, this.derivationMode);
    if (total.minus(amount).minus(feeWithChange).lt(0)) {
      return {
        totalValue: total,
        unspentUtxos: unspentUtxoSelected,
        fee: Math.ceil(fee),
        needChangeoutput: false,
      };
    }
    return {
      totalValue: total,
      unspentUtxos: unspentUtxoSelected,
      fee: Math.ceil(feeWithChange),
      needChangeoutput: true,
    };
  }
}
