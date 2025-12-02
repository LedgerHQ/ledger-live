import {
  SuiCallArg,
  SuiTransaction,
} from "@mysten/sui/client";
import BigNumber from "bignumber.js";

export type ProgrammableTransaction = {
  inputs: SuiCallArg[];
  kind: "ProgrammableTransaction";
  transactions: SuiTransaction[];
};

export type AccountBalance = {
  coinType: string;
  blockHeight: number;
  balance: BigNumber;
};
