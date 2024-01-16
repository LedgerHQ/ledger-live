import { Observable } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { TezosToolkit } from "@taquito/taquito";
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

          // Disable the broadcast because we want to do it in a second phase (broadcast hook)
          // Use a dummy transaction hash, we don't care about this check
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          tezos.contract.context.injector.inject = async () =>
            "op4WsnE6gvDPFFzbXtsX1wLCsuAAbkA8JhXKApxvEYmaEd3fpNC";

          o.next({ type: "device-signature-requested" });

          let type: OperationType = "OUT";

          let opbytes: string;

          const params = {
            fee: transaction.fees?.toNumber() || 0,
            storageLimit: transaction.storageLimit?.toNumber() || 0,
            gasLimit: transaction.gasLimit?.toNumber() || 0,
          };

          switch (transaction.mode) {
            case "send": {
              const res = await tezos.contract.transfer({
                mutez: true,
                to: transaction.recipient,
                amount: transaction.amount.toNumber(),
                ...params,
              });

              opbytes = res.raw.opbytes;
              break;
            }
            case "delegate": {
              const res = await tezos.contract.setDelegate({
                ...params,
                source: freshAddress,
                delegate: transaction.recipient,
              });
              opbytes = res.raw.opbytes;
              type = "DELEGATE";
              break;
            }
            case "undelegate": {
              const res = await tezos.contract.setDelegate({
                ...params,
                source: freshAddress,
              });
              opbytes = res.raw.opbytes;
              type = "UNDELEGATE";
              break;
            }
            default: {
              throw new Error("not supported");
            }
          }

          if (cancelled) {
            return;
          }

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
              signature: opbytes,
            },
          });
        }

        main().then(
          () => o.complete(),
          err => o.error(err),
        );

        return () => {
          cancelled = true;
        };
      }),
  );
