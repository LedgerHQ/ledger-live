import { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
import { decode, encode } from "ripple-binary-codec";
import { getLedgerIndex } from "../network";
import { estimateFees } from "./estimateFees";
import { JsonObject } from "ripple-binary-codec/dist/types/serialized-type";
import { SignerEntry } from "../types";
import { sortSignersByNumericAddress } from "./utils";

const LEDGER_OFFSET = 20;

function craftRawTransactionMultiSign(
  xrplTransaction: JsonObject,
  sender: string,
  publicKey: string,
): CraftedTransaction {
  if (!xrplTransaction.Fee) {
    throw new Error("Fee is required for multi sign transactions");
  }
  if (!xrplTransaction.Sequence) {
    throw new Error("Sequence is required for multi sign transactions");
  }

  const signer: SignerEntry = {
    Signer: {
      Account: sender,
      SigningPubKey: publicKey,
      TxnSignature: "",
    },
  };

  if (!xrplTransaction.Signers || !Array.isArray(xrplTransaction.Signers)) {
    xrplTransaction.Signers = [signer];
  } else {
    xrplTransaction.Signers.push(signer);
    // The Signers array must be sorted based on the numeric value of the signer addresses
    // We could probably insert it at the right place directly but like this we make sure the rest is also sorted
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    xrplTransaction.Signers = sortSignersByNumericAddress(xrplTransaction.Signers as SignerEntry[]);
  }

  const serializedTransaction = encode(xrplTransaction);

  return { transaction: serializedTransaction };
}

export async function craftRawTransaction(
  transaction: string,
  sender: string,
  publicKey: string,
  sequence: bigint,
): Promise<CraftedTransaction> {
  const xrplTransaction: JsonObject = decode(transaction);

  // Multi sign transactions have an empty SigningPubKey
  // We only check some of the fields and cannot autofill others
  // The sender cannot be checked because the transaction can be signed by another account
  // https://xrpl.org/docs/concepts/accounts/multi-signing#sending-multi-signed-transactions
  // https://xrpl.org/docs/tutorials/how-tos/manage-account-settings/send-a-multi-signed-transaction
  if (xrplTransaction.SigningPubKey === "") {
    return craftRawTransactionMultiSign(xrplTransaction, sender, publicKey);
  }

  if (sender !== xrplTransaction.Account) {
    throw new Error("Sender address does not match the transaction account");
  }

  if (!xrplTransaction.Fee) {
    const { fees } = await estimateFees();
    xrplTransaction.Fee = fees.toString();
  }

  // Enforce XRPL spec: If TicketSequence is provided, Sequence MUST be 0 regardless of any pre-set value.
  // https://xrpl.org/docs/references/protocol/transactions/common-fields#transaction-common-fields
  if (xrplTransaction.TicketSequence) {
    xrplTransaction.Sequence = 0;
  } else if (!xrplTransaction.Sequence) {
    xrplTransaction.Sequence = Number(sequence);
  }

  if (!xrplTransaction.LastLedgerSequence) {
    xrplTransaction.LastLedgerSequence = (await getLedgerIndex()) + LEDGER_OFFSET;
  }

  if (!xrplTransaction.SigningPubKey) {
    xrplTransaction.SigningPubKey = publicKey;
  }

  const serializedTransaction = encode(xrplTransaction);

  return { transaction: serializedTransaction };
}
