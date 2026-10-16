import BigNumber from "bignumber.js";
import sortBy from "lodash/sortBy";
import { NotEnoughBalance } from "../errors";
import { Output } from "../storage/types";
import { PickingStrategy, type UtxoSelection, withoutExcludedUtxos } from "./types";
import * as utils from "../utils";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { OutputInfo } from "..";

/**
 * prioritizes the oldest UTXOs in the current transaction
 */
export class DeepFirst extends PickingStrategy {
  selectFromUtxos(
    logger: Logger,
    candidates: Output[],
    outputs: OutputInfo[],
    feePerByte: number,
  ): UtxoSelection {
    logger("picking strategy", "Deepfirst");
    let unspentUtxos = withoutExcludedUtxos(candidates, this.excludedUTXOs);

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
