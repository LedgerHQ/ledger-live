import BigNumber from "bignumber.js";
import { OutputInfo } from "..";
import { ICrypto } from "../crypto/types";
import { Output } from "../storage/types";
import Xpub from "../xpub";

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
    }>
  ) {
    this.crypto = crypto;
    this.derivationMode = derivationMode;
    this.excludedUTXOs = excludedUTXOs;
  }

  abstract selectUnspentUtxosToUse(
    xpub: Xpub,
    outputs: OutputInfo[],
    feePerByte: number
  ): Promise<{
    unspentUtxos: Output[];
    totalValue: BigNumber;
    fee: number;
    needChangeoutput: boolean;
  }>;
}
