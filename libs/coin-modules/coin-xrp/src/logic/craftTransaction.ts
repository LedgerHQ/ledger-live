import BigNumber from "bignumber.js";
import invariant from "invariant";
import { encode } from "ripple-binary-codec";
import XrplDefinitions from "ripple-binary-codec/dist/enums/definitions.json";
import { getLedgerIndex } from "../network";
import { UINT32_MAX, validateTag } from "./utils";

const LEDGER_OFFSET = 20;

const { TRANSACTION_TYPES } = XrplDefinitions;
type XrplTransaction = {
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

export async function craftTransaction(
  account: {
    address: string;
    nextSequenceNumber: number;
  },
  transaction: {
    recipient: string;
    amount: bigint;
    fee: bigint;
    tag?: number | null | undefined;
  },
  publicKey?: string,
): Promise<{
  xrplTransaction: XrplTransaction;
  serializedTransaction: string;
}> {
  const tag = transaction.tag ? transaction.tag : undefined;
  const xrplTransaction: XrplTransaction = {
    TransactionType: "Payment",
    Account: account.address,
    Amount: transaction.amount.toString(),
    Destination: transaction.recipient,
    DestinationTag: tag,
    Fee: transaction.fee.toString(),
    Flags: 2147483648,
    Sequence: account.nextSequenceNumber,
    LastLedgerSequence: (await getLedgerIndex()) + LEDGER_OFFSET,
  };

  if (tag) {
    invariant(
      validateTag(new BigNumber(tag)),
      `tag is set but is not in a valid format, should be between [0 - ${UINT32_MAX.toString()}]`,
    );
  }

  const serializedTransaction = publicKey
    ? encode({
        ...xrplTransaction,
        SigningPubKey: publicKey,
      })
    : encode({
        ...xrplTransaction,
      });

  return {
    xrplTransaction,
    serializedTransaction,
  };
}
