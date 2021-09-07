// @flow

import { Observable } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { TezosToolkit } from "@taquito/taquito";
import type { Transaction } from "./types";
import type { Account, SignOperationEvent } from "../../types";
import { withDevice } from "../../hw/deviceAccess";
import { getEnv } from "../../env";
import { FeeNotLoaded } from "@ledgerhq/errors";

export const signOperation = ({
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
        const { fees } = transaction;
        if (!fees) throw new FeeNotLoaded();

        const { freshAddressPath, freshAddress } = account;

        const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

        const ledgerSigner = new LedgerSigner(
          transport,
          freshAddressPath,
          false,
          DerivationType.ED25519
        );
        tezos.setProvider({ signer: ledgerSigner });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tezos.contract.context.injector.inject = async () => ""; // disable broadcast

        o.next({ type: "device-signature-requested" });

        let res, signature, opbytes;
        switch (transaction.mode) {
          case "send":
            res = await tezos.contract.transfer({
              to: transaction.recipient,
              amount: transaction.amount.div(10 ** 6).toNumber(),
              fee: transaction.fees?.toNumber() || 0,
              storageLimit: transaction.storageLimit?.toNumber() || 0,
              gasLimit: transaction.gasLimit?.toNumber() || 0,
            });
            signature = res.raw.opOb.signature;
            opbytes = res.raw.opbytes;
            break;
          case "delegate":
            res = await tezos.contract.setDelegate({
              source: freshAddress,
              delegate: transaction.recipient,
            });
            opbytes = res.raw.opbytes;
            break;
          case "undelegate":
            res = await tezos.contract.setDelegate({
              source: freshAddress,
            });
            opbytes = res.raw.opbytes;
            break;
          default:
            throw "not supported";
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
        const operation = {
          id: `${accountId}-${txHash}-OUT`,
          hash: txHash,
          type: "OUT",
          value: transaction.amount,
          fee: fees,
          extra: {
            storageLimit: transaction.storageLimit,
            gasLimit: transaction.gasLimit,
            opbytes,
          },
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
