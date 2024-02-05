import { Observable } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { OpKind, TezosToolkit } from "@taquito/taquito";
import type { TezosOperation, Transaction } from "./types";
import type { OperationType, SignOperationFnSignature } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

export const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        let cancelled = false;

        async function main() {
          const { fees } = transaction;
          if (!fees) throw new FeeNotLoaded();

          const { freshAddressPath, freshAddress } = account;

          const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

          const ledgerSigner = new LedgerSigner(
            transport,
            freshAddressPath,
            false,
            DerivationType.ED25519,
          );

          tezos.setProvider({ signer: ledgerSigner });

          const { rpc } = tezos;
          const block = await rpc.getBlock();
          const sourceData = await rpc.getContract(freshAddress);

          o.next({ type: "device-signature-requested" });

          let type: OperationType = "NONE";

          let forgedBytes: string;

          switch (transaction.mode) {
            case "send": {
              type = "OUT";
              forgedBytes = await rpc.forgeOperations({
                branch: block.hash,
                contents: [
                  {
                    kind: OpKind.TRANSACTION,
                    fee: (transaction.fees || 0).toString(),
                    gas_limit: (transaction.gasLimit || 0).toString(),
                    storage_limit: (transaction.storageLimit || 0).toString(),
                    amount: transaction.amount.toString(),
                    destination: transaction.recipient,
                    source: freshAddress,
                    counter: (Number(sourceData.counter) + 1).toString(),
                  },
                ],
              });

              break;
            }
            case "delegate": {
              type = "DELEGATE";

              forgedBytes = await rpc.forgeOperations({
                branch: block.hash,
                contents: [
                  {
                    kind: OpKind.DELEGATION,
                    fee: (transaction.fees || 0).toString(),
                    gas_limit: (transaction.gasLimit || 0).toString(),
                    storage_limit: (transaction.storageLimit || 0).toString(),
                    source: freshAddress,
                    counter: (Number(sourceData.counter) + 1).toString(),
                    delegate: transaction.recipient,
                  },
                ],
              });

              break;
            }
            case "undelegate": {
              type = "UNDELEGATE";

              // we undelegate as there's no "delegate" field
              // OpKind is still "DELEGATION"
              forgedBytes = await rpc.forgeOperations({
                branch: block.hash,
                contents: [
                  {
                    kind: OpKind.DELEGATION,
                    fee: (transaction.fees || 0).toString(),
                    gas_limit: (transaction.gasLimit || 0).toString(),
                    storage_limit: (transaction.storageLimit || 0).toString(),
                    source: freshAddress,
                    counter: (Number(sourceData.counter) + 1).toString(),
                  },
                ],
              });

              break;
            }
            default:
              throw new Error("not supported");
          }

          if (cancelled) {
            return;
          }

          const signature = await ledgerSigner.sign(
            forgedBytes,
            Uint8Array.from(Buffer.from("0x03", "hex")),
          );

          o.next({ type: "device-signature-granted" });

          // build optimistic operation
          const txHash = ""; // resolved at broadcast time
          const senders = [freshAddress];
          const recipients = [transaction.recipient];
          const accountId = account.id;

          // currently, all mode are always at least one OUT tx on ETH parent
          const operation: TezosOperation = {
            id: encodeOperationId(accountId, txHash, type),
            hash: txHash,
            type,
            value: transaction.amount,
            fee: fees,
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders,
            recipients,
            accountId,
            date: new Date(),
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signature.sbytes.slice(4),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );

        return () => {
          cancelled = true;
        };
      }),
  );
