import BigNumber from "bignumber.js";
import { OutputInfo } from "..";
import { ICrypto } from "../crypto/types";
import { Output } from "../storage/types";
import Xpub from "../xpub";
import { LogFn, noopLog } from "../logger";

export abstract class PickingStrategy {
  crypto: ICrypto;

  derivationMode: string;

  // TODO Write tests for excluded UTXOs
  excludedUTXOs: Array<{
    hash: string;
    outputIndex: number;
  }>;

  protected readonly log: LogFn;

  constructor(
    crypto: ICrypto,
    derivationMode: string,
    excludedUTXOs: Array<{
      hash: string;
      outputIndex: number;
    }>,
    log: LogFn = noopLog,
  ) {
    this.crypto = crypto;
    this.derivationMode = derivationMode;
    this.excludedUTXOs = excludedUTXOs;
    this.log = log;
  }

  /**
   * returns the unspent UTXOs to use as input for the transaction
   */
  abstract selectUnspentUtxosToUse(
    xpub: Xpub,
    outputs: OutputInfo[],
    feePerByte: number,
  ): Promise<{
    unspentUtxos: Output[];
    totalValue: BigNumber;
    fee: number;
    needChangeoutput: boolean;
  }>;
}
