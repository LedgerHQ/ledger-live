import BigNumber from "bignumber.js";
import flatten from "lodash/flatten";
import { OutputInfo } from "..";
import { ICrypto } from "../crypto/types";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import type { Logger } from "@ledgerhq/coin-module-framework/config";

export type UtxoSelection = {
  unspentUtxos: Output[];
  totalValue: BigNumber;
  fee: number;
  needChangeoutput: boolean;
};

export abstract class PickingStrategy {
  crypto: ICrypto;

  derivationMode: string;

  // TODO Write tests for excluded UTXOs
  excludedUTXOs: Array<{
    hash: string;
    outputIndex: number;
  }>;

  constructor(
    crypto: ICrypto,
    derivationMode: string,
    excludedUTXOs: Array<{
      hash: string;
      outputIndex: number;
    }>,
  ) {
    this.crypto = crypto;
    this.derivationMode = derivationMode;
    this.excludedUTXOs = excludedUTXOs;
  }

  /**
   * Selects, among the given candidates, the UTXOs to use as inputs of the transaction.
   *
   * Pure: the caller provides the whole candidate set, so no account state is read. The excluded
   * UTXOs of this strategy are removed from the candidates first.
   */
  abstract selectFromUtxos(
    logger: Logger,
    unspentUtxos: Output[],
    outputs: OutputInfo[],
    feePerByte: number,
  ): UtxoSelection;

  /**
   * returns the unspent UTXOs to use as input for the transaction, among those of every address of
   * the xpub
   */
  async selectUnspentUtxosToUse(
    logger: Logger,
    xpub: Xpub,
    outputs: OutputInfo[],
    feePerByte: number,
  ): Promise<UtxoSelection> {
    const addresses = await xpub.getXpubAddresses();
    const unspentUtxos = flatten(
      await Promise.all(addresses.map(address => xpub.storage.getAddressUnspentUtxos(address))),
    );
    return this.selectFromUtxos(logger, unspentUtxos, outputs, feePerByte);
  }
}

export function withoutExcludedUtxos(
  unspentUtxos: Output[],
  excludedUTXOs: Array<{ hash: string; outputIndex: number }>,
): Output[] {
  return unspentUtxos.filter(
    o =>
      !excludedUTXOs.filter(x => x.hash === o.output_hash && x.outputIndex === o.output_index)
        .length,
  );
}
