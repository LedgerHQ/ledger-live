import BigNumber from "bignumber.js";
import { Address, Input } from "./storage/types";

export enum DerivationModes {
  LEGACY = "Legacy",
  NATIVE_SEGWIT = "Native SegWit", // This is for native segwit v0
  SEGWIT = "SegWit", // This is wrapped segwit v0 (wrapping is only allowed for v0)
  TAPROOT = "Taproot", // This is for segwit v1+
}

export type InputInfo = Input & { txHex: string };

export type OutputInfo = {
  script: Buffer;
  value: BigNumber;
  // address can be null if OP_RETURN transaction
  address: string | null;
  isChange: boolean;
};

// Used when building a transaction to sign and broadcast
export type TransactionInfo = {
  inputs: InputInfo[];
  associatedDerivations: [number, number][];
  outputs: OutputInfo[];
  fee: number;
  changeAddress: Address;
};
