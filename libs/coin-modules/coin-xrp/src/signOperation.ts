import invariant from "invariant";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { encode } from "ripple-binary-codec";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import XrplDefinitions from "ripple-binary-codec/dist/enums/definitions.json";
import { getNextValidSequence, removeCachedRecipientIsNew, UINT32_MAX, validateTag } from "./logic";
import { XrpSignature, XrpSigner } from "./signer";
import { getLedgerIndex } from "./api";
import { Transaction } from "./types";

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

export const buildSignOperation =
  (signerContext: SignerContext<XrpSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      removeCachedRecipientIsNew(transaction.recipient);

      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();
        try {
          const tag = transaction.tag ? transaction.tag : undefined;
          const nextSequenceNumber = await getNextValidSequence(account);
          const xrplTransaction: XrplTransaction = {
            TransactionType: "Payment",
            Account: account.freshAddress,
            Amount: transaction.amount.toFixed(),
            Destination: transaction.recipient,
            DestinationTag: tag,
            Fee: fee.toFixed(),
            Flags: 2147483648,
            Sequence: nextSequenceNumber,
            LastLedgerSequence: (await getLedgerIndex()) + LEDGER_OFFSET,
          };

          if (tag)
            invariant(
              validateTag(new BigNumber(tag)),
              `tag is set but is not in a valid format, should be between [0 - ${UINT32_MAX.toString()}]`,
            );

          o.next({
            type: "device-signature-requested",
          });

          const signature = (await signerContext(deviceId, async signer => {
            const { freshAddressPath: derivationPath } = account;
            const { publicKey } = await signer.getAddress(derivationPath);

            const serializedTransaction = encode({
              ...xrplTransaction,
              SigningPubKey: publicKey,
            });
            const transactionSignature = await signer.signTransaction(
              derivationPath,
              serializedTransaction,
            );

            return encode({
              ...xrplTransaction,
              SigningPubKey: publicKey,
              TxnSignature: transactionSignature,
            }).toUpperCase();
          })) as XrpSignature;

          o.next({
            type: "device-signature-granted",
          });

          const hash = "";
          const operation: Operation = {
            id: encodeOperationId(account.id, hash, "OUT"),
            hash,
            accountId: account.id,
            type: "OUT",
            value: transaction.amount,
            fee,
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            date: new Date(),
            transactionSequenceNumber: nextSequenceNumber,
            extra: {},
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
            },
          });
        } catch (e) {
          if (e instanceof Error) {
            throw new Error(
              (e as Error & { data?: { resultMessage?: string } })?.data?.resultMessage,
            );
          }

          throw e;
        }
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
