/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Account, Operation, SignOperationEvent } from "@ledgerhq/types-live";
import Nervos from "@ledgerhq/hw-app-nervos";
import type { NervosAccount, Transaction } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import { buildTransaction } from "./js-buildTransaction";
import {
  EMPTY_SECP_SIG,
  EMPTY_WITNESS_ARGS,
} from "@nervosnetwork/ckb-sdk-utils/lib/const";
import {
  rawTransactionToHash,
  scriptToAddress,
  scriptToHash,
  serializeWitnessArgs,
} from "@nervosnetwork/ckb-sdk-utils";
import { AccountNeedResync } from "../../errors";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation = ({
  account: a,
  deviceId,
  transaction: t,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      async function main() {
        o.next({
          type: "device-signature-requested",
        });

        if (!t.feePerByte || t.feePerByte.eq(new BigNumber(0))) {
          throw new FeeNotLoaded();
        }

        const { tx, status } = await buildTransaction(a as NervosAccount, t);
        const nervosResources = (a as NervosAccount).nervosResources;
        if (!nervosResources) {
          throw new AccountNeedResync();
        }
        const xpub = nervosResources.xpub;
        const { txs } = xpub.getTransactions();
        const context = tx.inputs.map(
          (input) =>
            txs.find(
              (tx) =>
                tx.hash.toLowerCase() ===
                input.previousOutput!.txHash.toLowerCase()
            )!
        );

        const nervos = new Nervos(transport);

        const witnessSigningEntries = tx.inputs.map((input, index) => {
          const previousOutput: CKBComponents.CellOutput =
            context[index].outputs[parseInt(input.previousOutput!.index)]!;
          const lock: CKBComponents.Script = previousOutput.lock;
          const wit: CKBComponents.WitnessArgs | CKBComponents.Witness =
            tx.witnesses[index];
          const witnessArgs: CKBComponents.WitnessArgs =
            wit && typeof wit != "string" ? wit : EMPTY_WITNESS_ARGS;
          return {
            witnessArgs,
            lockHash: scriptToHash(previousOutput.lock),
            serializedWitness: "",
            lock,
          };
        });
        const lockHashes = new Set(
          witnessSigningEntries.map((w) => w.lockHash)
        );
        for (const lockHash of lockHashes) {
          const witnessesArgs = witnessSigningEntries.filter(
            (w) => w.lockHash === lockHash
          );
          // A 65-byte empty signature used as placeholder
          witnessesArgs[0].witnessArgs.lock = EMPTY_SECP_SIG;
          const path = xpub.getAddressPath(
            scriptToAddress(witnessesArgs[0].lock)
          );
          const serializedWitnesses = witnessesArgs.map((value) => {
            const args = value.witnessArgs;
            if (
              args.lock === undefined &&
              args.inputType === undefined &&
              args.outputType === undefined
            ) {
              return "0x";
            }
            return serializeWitnessArgs(args);
          });
          const signature = await nervos.signTransaction(
            path,
            nervosResources.freshChangeAddressPath,
            tx,
            context,
            serializedWitnesses
          );
          const witnessEntry = witnessSigningEntries.find(
            (w) => w.lockHash === lockHash
          )!;
          witnessEntry.serializedWitness = serializeWitnessArgs({
            lock: "0x" + signature,
            inputType: witnessEntry.witnessArgs.inputType ?? "",
            outputType: "",
          });
        }
        tx.witnesses = witnessSigningEntries.map(
          (w) => w.serializedWitness || "0x"
        );
        const hash = rawTransactionToHash(tx);

        o.next({ type: "device-signature-granted" });

        const type = "OUT";
        const operation: Operation = {
          id: encodeOperationId(a.id, hash, type),
          hash,
          type,
          value: status.totalSpent,
          fee: status.estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: tx.inputs.map((input, index) =>
            scriptToAddress(
              context[index].outputs[parseInt(input.previousOutput!.index)].lock
            )
          ),
          recipients: [t.recipient],
          accountId: a.id,
          date: new Date(),
          extra: {},
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: JSON.stringify(tx),
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );
    })
  );
