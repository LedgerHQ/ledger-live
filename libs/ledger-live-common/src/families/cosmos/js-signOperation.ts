import {
  Account,
  Operation,
  OperationType,
  SignOperationEvent,
} from "../../types";
import type { Transaction } from "./types";
import { getAccount, getChainId } from "./api/Cosmos";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { encodePubkey } from "@cosmjs/proto-signing";
import { encodeOperationId } from "../../operation";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import { AminoTypes } from "@cosmjs/stargate";
import { stringToPath } from "@cosmjs/crypto";
import { buildTransaction, postBuildTransaction } from "./js-buildTransaction";
import BigNumber from "bignumber.js";

const aminoTypes = new AminoTypes({ prefix: "cosmos" });

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      let cancelled;

      async function main() {
        const { accountNumber, sequence } = await getAccount(
          account.freshAddress
        );

        const chainId = await getChainId();

        const hdPaths: any = stringToPath("m/" + account.freshAddressPath);

        const ledgerSigner = new LedgerSigner(transport, {
          hdPaths: [hdPaths],
        });

        o.next({ type: "device-signature-requested" });

        const accounts = await ledgerSigner.getAccounts();

        let pubkey;

        accounts.forEach((a) => {
          if (a.address == account.freshAddress) {
            pubkey = encodePubkey({
              type: "tendermint/PubKeySecp256k1",
              value: Buffer.from(a.pubkey).toString("base64"),
            });
          }
        });

        const unsignedPayload = await buildTransaction(account, transaction);

        const msgs = unsignedPayload.map((msg) => aminoTypes.toAmino(msg));

        // Note:
        // We don't use Cosmos App,
        // Cosmos App support legacy StdTx and required to be ordered in a strict way,
        // Cosmos API expects a different sorting, resulting in a separate signature.
        // https://github.com/LedgerHQ/app-cosmos/blob/6c194daa28936e273f9548eabca9e72ba04bb632/app/src/tx_parser.c#L52

        // Cosmos App sign data in Amino way only, not Protobuf.
        // This is a legacy outdated standard and a long-term blocking point.

        // @ledgerhq/hw-app-cosmos don't allow to push message to device message converted
        // by the AminoConverter from @cosmjs/stargate. There's two things who don't work:
        // 1st, the way who message is sorted.
        // 2nd, cast of numeric value (integer/numeric versus string).

        const signed = await ledgerSigner.signAmino(account.freshAddress, {
          chain_id: chainId,
          account_number: accountNumber.toString(),
          sequence: sequence.toString(),
          fee: {
            amount: [
              {
                denom: account.currency.units[1].code,
                amount: transaction.fees?.toString() as string,
              },
            ],
            gas: transaction.gas?.toString() as string,
          },
          msgs: msgs,
          memo: transaction.memo || "",
        });

        const tx_bytes = await postBuildTransaction(
          account,
          transaction,
          pubkey,
          unsignedPayload,
          new Uint8Array(Buffer.from(signed.signature.signature, "base64"))
        );

        const signature = Buffer.from(tx_bytes).toString("hex");

        if (cancelled) {
          return;
        }

        o.next({ type: "device-signature-granted" });

        const hash = ""; // resolved at broadcast time
        const accountId = account.id;
        const fee = transaction.fees || new BigNumber(0);
        const extra = {};

        const type: OperationType =
          transaction.mode === "undelegate"
            ? "UNDELEGATE"
            : transaction.mode === "delegate"
            ? "DELEGATE"
            : transaction.mode === "redelegate"
            ? "REDELEGATE"
            : ["claimReward", "claimRewardCompound"].includes(transaction.mode)
            ? "REWARD"
            : "OUT";

        const senders: string[] = [];
        const recipients: string[] = [];

        if (transaction.mode === "send") {
          senders.push(account.freshAddress);
          recipients.push(transaction.recipient);
        }

        if (transaction.mode === "redelegate") {
          Object.assign(extra, {
            cosmosSourceValidator: transaction.cosmosSourceValidator,
          });
        }

        if (transaction.mode !== "send") {
          Object.assign(extra, {
            validators: transaction.validators,
          });
        }

        // build optimistic operation
        const operation: Operation = {
          id: encodeOperationId(accountId, hash, type),
          hash,
          type,
          value: transaction.useAllAmount
            ? account.spendableBalance
            : transaction.amount.plus(fee),
          fee,
          extra,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId,
          date: new Date(),
          transactionSequenceNumber: sequence,
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );

      return () => {
        cancelled = true;
      };
    })
  );

export default signOperation;
