import BigNumber from "bignumber.js";
import flatten from "lodash/flatten";
import sortBy from "lodash/sortBy";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import { PickingStrategy } from "./types";
import * as utils from "../utils";
import { DeepFirst } from "./DeepFirst";
import { log } from "@ledgerhq/logs";
import { OutputInfo } from "..";

/**
 * Coinselect algorithm
 * Aims to pick the best UTXOs to minimize the transaction fees in the current transaction
 */
export class CoinSelect extends PickingStrategy {
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
    log("picking strategy", "Coinselect");

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

    const TOTAL_TRIES = 100000;
    log("picking strategy", "utxos", unspentUtxos);
    // Compute cost of change
    const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));
    // Compute sizes (integer vbytes)
    const fixedV = utils.maxTxVBytesCeil(0, [], false, this.crypto, this.derivationMode);

    const outputScripts = outputs.map(o => o.script);
    //
    // Recipient output vbytes (used only for base/no-input fee calc)
    const oneOutputV =
      outputScripts.length > 0
        ? utils.maxTxVBytesCeil(0, [outputScripts[0]], false, this.crypto, this.derivationMode) -
          fixedV
        : utils.maxTxVBytesCeil(0, [], true, this.crypto, this.derivationMode) - fixedV;

    // change delta (based on input derivation, i.e., the change output we’ll actually add)
    const changeDeltaV =
      utils.maxTxVBytesCeil(0, [], true, this.crypto, this.derivationMode) - fixedV;

    const oneInputV =
      utils.maxTxVBytesCeil(1, [], false, this.crypto, this.derivationMode) - fixedV;

    // Calculate effective value of outputs
    let currentAvailableValue = 0;
    let effectiveUtxos: Array<{
      index: number;
      effectiveValue: number;
    }> = [];

    for (let i = 0; i < unspentUtxos.length; i += 1) {
      const outEffectiveValue = Number(unspentUtxos[i].value) - safeFeePerByte * oneInputV;
      if (outEffectiveValue > 0) {
        const effectiveUtxo = {
          index: i,
          effectiveValue: outEffectiveValue,
        };
        effectiveUtxos.push(effectiveUtxo);
        currentAvailableValue += outEffectiveValue;
      }
    }

    // Get no inputs fees
    // At beginning, there are no outputs in tx, so noInputFees are fixed fees
    const notInputFees = safeFeePerByte * (fixedV + oneOutputV * outputs.length);
    // Start coin selection algorithm (according to SelectCoinBnb from Bitcoin Core)
    let currentValue = 0;
    const currentSelection: boolean[] = [];

    const amount = outputs.reduce((sum, output) => sum.plus(output.value), new BigNumber(0));
    // Actual amount we are targetting
    const actualTarget = notInputFees + amount.toNumber();
    // Insufficient funds
    if (currentAvailableValue < actualTarget) {
      throw new NotEnoughBalance();
    }
    // Sort utxos by effectiveValue
    effectiveUtxos = sortBy(effectiveUtxos, "effectiveValue");
    effectiveUtxos = effectiveUtxos.reverse();
    let currentWaste = 0;
    let bestWaste = Number.MAX_SAFE_INTEGER;
    let bestSelection: boolean[] = [];

    // Dfs to find a solution with minimal fees
    let bestSelectionNeedChangeoutput = false;
    let currentSelectionNeedChangeoutput = false;
    for (let i = 0; i < TOTAL_TRIES; i += 1) {
      let backtrack = false;
      const nbInput = currentSelection.filter(x => x).length;
      if (currentValue >= actualTarget) {
        // Decide “add change?” against the real change delta, not the recipient script size
        if (currentValue - actualTarget >= safeFeePerByte * changeDeltaV) {
          // changeoutput is required
          currentSelectionNeedChangeoutput = true;
          currentWaste =
            safeFeePerByte *
            utils.maxTxVBytesCeil(nbInput, outputScripts, true, this.crypto, this.derivationMode);
        } else {
          // changeoutput is not required
          currentSelectionNeedChangeoutput = false;
          currentWaste =
            safeFeePerByte *
              utils.maxTxVBytesCeil(
                nbInput,
                outputScripts,
                false,
                this.crypto,
                this.derivationMode,
              ) +
            currentValue -
            actualTarget;
        }
        if (currentWaste <= bestWaste) {
          bestSelection = currentSelection.slice();
          while (effectiveUtxos.length > bestSelection.length) {
            bestSelection.push(false);
          }
          bestSelection.length = effectiveUtxos.length;
          bestWaste = currentWaste;
          bestSelectionNeedChangeoutput = currentSelectionNeedChangeoutput;
        }
        backtrack = true;
      }
      if (currentSelection.length >= effectiveUtxos.length) {
        backtrack = true;
      }
      // Move backwards
      if (backtrack) {
        while (currentSelection.length > 0 && !currentSelection[currentSelection.length - 1]) {
          currentSelection.pop();
        }
        // Case we walked back to the first utxos and all solutions searched.
        if (currentSelection.length === 0) {
          break;
        }
        currentSelection[currentSelection.length - 1] = false;
        const eu = effectiveUtxos[currentSelection.length - 1];
        currentValue -= eu.effectiveValue;
      } else {
        // Moving forwards, continuing down this branch
        const eu = effectiveUtxos[currentSelection.length];
        currentSelection.push(true);
        currentValue += eu.effectiveValue;
      }
    }
    // solution found
    if (bestSelection.length > 0) {
      let total = new BigNumber(0);
      const unspentUtxoSelected: Output[] = [];
      for (let i = 0; i < bestSelection.length; i += 1) {
        if (bestSelection[i]) {
          unspentUtxoSelected.push(unspentUtxos[effectiveUtxos[i].index]);
          total = total.plus(unspentUtxos[effectiveUtxos[i].index].value);
        }
      }
      const fee =
        safeFeePerByte *
        utils.maxTxVBytesCeil(
          unspentUtxoSelected.length,
          outputScripts,
          bestSelectionNeedChangeoutput,
          this.crypto,
          this.derivationMode,
        );
      return {
        totalValue: total,
        unspentUtxos: unspentUtxoSelected,
        fee: Math.ceil(fee),
        needChangeoutput: bestSelectionNeedChangeoutput,
      };
    }

    const pickingStrategy = new DeepFirst(this.crypto, this.derivationMode, this.excludedUTXOs);
    return pickingStrategy.selectUnspentUtxosToUse(xpub, outputs, feePerByte);
  }
}
