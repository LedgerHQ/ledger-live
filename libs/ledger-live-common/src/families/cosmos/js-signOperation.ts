import type { CosmosAccount, Transaction } from "./types";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Cosmos from "@ledgerhq/hw-app-cosmos";
// import { AminoTypes } from "@cosmjs/stargate";
import { LedgerSigner } from "@cosmjs/ledger-amino";
import { stringToPath } from "@cosmjs/crypto";
import {
  buildTransaction,
  buildTransaction2,
  postBuildTransaction,
  postBuildTransaction2,
} from "./js-buildTransaction";
import BigNumber from "bignumber.js";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { makeSignDoc } from "@cosmjs/launchpad";

import type {
  Account,
  Operation,
  OperationType,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { CosmosAPI } from "./api/Cosmos";

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
        const hwApp = new Cosmos(transport);
        const cosmosAPI = new CosmosAPI(account.currency.id);
        const { accountNumber, sequence } = await cosmosAPI.getAccount(
          account.freshAddress
        );

        const chainId = await cosmosAPI.getChainId();

        o.next({ type: "device-signature-requested" });
        const { aminoMsgs, protoMsgs } = await buildTransaction2(
          account,
          transaction
        );

        const feeToEncode = {
          amount: [
            {
              denom: account.currency.units[1].code,
              amount: transaction.fees?.toString() as string,
            },
          ],
          gas: transaction.gas?.toString() as string,
        };
        // Note:
        // Cosmos Nano App sign data in Amino way only, not Protobuf.
        // This is a legacy outdated standard and a long-term blocking point.

        let tx_bytes: Uint8Array;
        if (account.currency.id === "cosmos") {
          const { publicKey } = await hwApp.getAddress(
            account.freshAddressPath,
            "cosmos",
            false
          );
          const pubkey = {
            typeUrl: "/cosmos.crypto.secp256k1.PubKey",
            value: new Uint8Array([
              ...new Uint8Array([10, 33]),
              ...new Uint8Array(Buffer.from(publicKey, "hex")),
            ]),
          };
          const unsignedPayload = await buildTransaction(
            account as CosmosAccount,
            transaction
          );
          const message = {
            chain_id: chainId,
            account_number: accountNumber.toString(),
            sequence: sequence.toString(),
            fee: feeToEncode,
            msgs: aminoMsgs,
            memo: transaction.memo || "",
          };
          const { signature } = await hwApp.sign(
            account.freshAddressPath,
            JSON.stringify(sortedObject(message))
          );
          if (!signature) {
            throw new Error("Cosmos: no Signature Found");
          }
          const secp256k1Signature = Secp256k1Signature.fromDer(
            new Uint8Array(signature)
          ).toFixedLength();

          tx_bytes = await postBuildTransaction(
            account as CosmosAccount,
            transaction,
            pubkey,
            unsignedPayload,
            secp256k1Signature
          );
        } else {
          const signDoc = makeSignDoc(
            aminoMsgs,
            feeToEncode,
            chainId,
            transaction.memo || "",
            accountNumber.toString(),
            sequence.toString()
          );
          const ledgerSigner = new LedgerSigner(transport, {
            hdPaths: [stringToPath("m/" + account.freshAddressPath)],
            prefix: account.currency.id,
          });

          const signResponse = await ledgerSigner.signAmino(
            account.freshAddress,
            signDoc
          );

          tx_bytes = await postBuildTransaction2(signResponse, protoMsgs);
        }
        const signed = Buffer.from(tx_bytes).toString("hex");

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
            sourceValidator: transaction.sourceValidator,
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
          value:
            type === "REWARD"
              ? new BigNumber(0)
              : transaction.useAllAmount
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
            signature: signed,
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

const sortedObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortedObject);
  }

  const sortedKeys = Object.keys(obj).sort();
  const result = {};

  sortedKeys.forEach((key) => {
    result[key] = sortedObject(obj[key]);
  });

  return result;
};

export default signOperation;
