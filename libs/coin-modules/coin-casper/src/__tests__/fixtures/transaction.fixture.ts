import BigNumber from "bignumber.js";
import {
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PublicKey,
  Transaction as CasperTransaction,
} from "casper-js-sdk";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES } from "../../constants";
import { getEstimatedFees } from "../../logic/estimateFees";
import type { Transaction } from "../../types";
import { TEST_ADDRESSES, TEST_TRANSFER_IDS } from "./addresses.fixture";

export const createMockTransaction = (options?: Partial<Transaction>): Transaction => {
  const defaultFees = getEstimatedFees();
  const transferId = options?.transferId;
  const memoValue = options?.memoValue ?? transferId ?? null;
  const memoType = options?.memoType ?? (memoValue !== null ? "transferId" : null);

  return {
    family: "casper",
    amount:
      options?.amount instanceof BigNumber
        ? options.amount
        : new BigNumber(options?.amount || CASPER_MINIMUM_VALID_AMOUNT_MOTES),
    recipient: options?.recipient || TEST_ADDRESSES.RECIPIENT_SECP256K1,
    fees: options?.fees instanceof BigNumber ? options.fees : defaultFees,
    memoType,
    memoValue,
    ...(transferId !== undefined && { transferId }),
    useAllAmount: options?.useAllAmount || false,
  };
};

export const createMockTransactionSet = (): Transaction[] => {
  return [
    createMockTransaction({ amount: new BigNumber("1000000000") }),
    createMockTransaction({ recipient: TEST_ADDRESSES.INVALID }),
    createMockTransaction({ amount: new BigNumber("0") }),
    createMockTransaction({ amount: new BigNumber("999000000000") }),
    createMockTransaction({ transferId: TEST_TRANSFER_IDS.VALID }),
    createMockTransaction({ transferId: TEST_TRANSFER_IDS.INVALID }),
    createMockTransaction({ useAllAmount: true }),
  ];
};

export type MockSignedTransaction = {
  unsignedTx: string;
  publicKey: string;
  taggedSignature: string;
  untaggedSignature: string;
  wrongKeypairSignature: string;
};

const buildUnsignedTransferTx = (sender: PublicKey, recipient: PublicKey): CasperTransaction =>
  new NativeTransferBuilder()
    .from(sender)
    .target(recipient)
    .amount("25000000000")
    .id(1)
    .chainName("casper-net-1")
    .payment(100_000_000)
    .build();

// Built via casper-js-sdk's own builder and signing path, not hand-written JSON, so a bad
// hash/payload pair can't fail validate() for the wrong reason.
export const createMockSignedTransaction = (): MockSignedTransaction => {
  const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
  const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);
  const impostor = PrivateKey.generate(KeyAlgorithm.SECP256K1);

  const unsignedTx = JSON.stringify(
    buildUnsignedTransferTx(sender.publicKey, recipient.publicKey).toJSON(),
  );

  const signedBySender = CasperTransaction.fromJSON(unsignedTx);
  signedBySender.sign(sender);
  const taggedSignature = signedBySender.approvals[0].signature.toHex();

  const signedByImpostor = CasperTransaction.fromJSON(unsignedTx);
  signedByImpostor.sign(impostor);
  const wrongKeypairSignature = signedByImpostor.approvals[0].signature.toHex();

  return {
    unsignedTx,
    publicKey: sender.publicKey.toHex(),
    taggedSignature,
    untaggedSignature: taggedSignature.slice(2),
    wrongKeypairSignature,
  };
};
