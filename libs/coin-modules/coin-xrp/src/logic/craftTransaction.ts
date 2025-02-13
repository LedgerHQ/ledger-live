import BigNumber from "bignumber.js";
import invariant from "invariant";
import { encode } from "ripple-binary-codec";
import XrplDefinitions from "ripple-binary-codec/dist/enums/definitions.json";
import { getLedgerIndex } from "../network";
import { UINT32_MAX, validateTag } from "./utils";

const LEDGER_OFFSET = 20;

const { TRANSACTION_TYPES } = XrplDefinitions;
type Memo = {
  MemoData?: string;
  MemoFormat?: string;
  MemoType?: string;
};
type MemoWrapper = {
  Memo: Memo;
};
type XrplTransaction = {
  TransactionType: keyof typeof TRANSACTION_TYPES;
  Flags: number;
  Account: string;
  Amount: string;
  Destination: string;
  DestinationTag?: number;
  Fee: string;
  Sequence: number;
  LastLedgerSequence: number;
  SigningPubKey?: string;
  TxnSignature?: string;
  Memos?: MemoWrapper[];
};

type MemoInput = {
  data?: string;
  format?: string;
  type?: string;
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
    destinationTag?: number | null | undefined;
    memos?: MemoInput[];
  },
  publicKey?: string,
): Promise<{
  xrplTransaction: XrplTransaction;
  serializedTransaction: string;
}> {
  const xrplTransaction: XrplTransaction = {
    TransactionType: "Payment",
    Account: account.address,
    Amount: transaction.amount.toString(),
    Destination: transaction.recipient,
    Fee: transaction.fee.toString(),
    Flags: 2147483648,
    Sequence: account.nextSequenceNumber,
    LastLedgerSequence: (await getLedgerIndex()) + LEDGER_OFFSET,
  };

  function memoMapper(memoInput: MemoInput): MemoWrapper {
    const memo: Memo = {};
    if (memoInput.data) {
      memo.MemoData = memoInput.data;
    }
    if (memoInput.format) {
      memo.MemoFormat = memoInput.format;
    }
    if (memoInput.type) {
      memo.MemoType = memoInput.type;
    }
    return { Memo: memo };
  }

  if (transaction.memos) {
    xrplTransaction.Memos = transaction.memos.map(memoMapper);
  }

  if (transaction.destinationTag) {
    invariant(
      validateTag(new BigNumber(transaction.destinationTag)),
      `tag is set but is not in a valid format, should be between [0 - ${UINT32_MAX.toString()}]`,
    );
    xrplTransaction.DestinationTag = transaction.destinationTag;
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
