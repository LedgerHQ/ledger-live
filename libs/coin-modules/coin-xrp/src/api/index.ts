import XrplDefinitions from "ripple-binary-codec/dist/enums/definitions.json";
import { setCoinConfig, XrpConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  listOperations,
} from "../logic";

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  blockHeight: number;
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
};
const { TRANSACTION_TYPES } = XrplDefinitions;
export type XrplTransaction = {
  TransactionType: keyof typeof TRANSACTION_TYPES;
  Flags: number;
  Account: string;
  Amount: string;
  Destination: string;
  DestinationTag: number | undefined;
  Fee: string;
  Sequence: number;
  LastLedgerSequence: number;
  SigningPubKey?: string;
  TxnSignature?: string;
};

export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey: string) => string;
  craftTransaction: (
    address: string,
    transaction: {
      recipient: string;
      amount: bigint;
      fee: bigint;
    },
  ) => Promise<string>;
  estimateFees: () => Promise<bigint>;
  getBalance: (address: string) => Promise<bigint>;
  listOperations: (address: string, blockHeight: number) => Promise<string>;
};
export function createApi(config: XrpConfig): Api {
  setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    listOperations,
  };
}

async function craft(
  address: string,
  transaction: {
    recipient: string;
    amount: bigint;
    fee: bigint;
  },
): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(address);
  const tx = await craftTransaction({ address, nextSequenceNumber }, transaction);
  return tx.serializedTransaction;
}

async function estimate(): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}
