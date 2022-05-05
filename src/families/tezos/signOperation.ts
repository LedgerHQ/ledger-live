// @flow

import { Observable } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { TezosToolkit } from "@taquito/taquito";
import type { Transaction } from "./types";
import type { Account, SignOperationEvent } from "../../types";
import { withDevice } from "../../hw/deviceAccess";
import { getEnv } from "../../env";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { upperModulo } from "../../modulo";
import BigNumber from "bignumber.js";

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

        // disable the broadcast because we want to do it in a second phase (broadcast hook)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tezos.contract.context.injector.inject = async () => "";

        o.next({ type: "device-signature-requested" });

        let type = "OUT";

        let res, opbytes;
        const params = {
          fee: transaction.fees?.toNumber() || 0,
          storageLimit: transaction.storageLimit?.toNumber() || 0,
          gasLimit: transaction.gasLimit?.toNumber() || 0,
        };

        if (["delegate", "undelegate"].includes(transaction.mode)) {
          // https://ledgerhq.atlassian.net/browse/LL-8821
          params.gasLimit = upperModulo(
            transaction.gasLimit || new BigNumber(0),
            new BigNumber(136),
            new BigNumber(1000)
          ).toNumber();
        }

        switch (transaction.mode) {
          case "send":
            res = await tezos.contract.transfer({
              mutez: true,
              to: transaction.recipient,
              amount: transaction.amount.toNumber(),
              ...params,
            });
            opbytes = res.raw.opbytes;
            break;
          case "delegate":
            res = await tezos.contract.setDelegate({
              ...params,
              source: freshAddress,
              delegate: transaction.recipient,
            });
            opbytes = res.raw.opbytes;
            type = "DELEGATE";
            break;
          case "undelegate":
            res = await tezos.contract.setDelegate({
              ...params,
              source: freshAddress,
            });
            opbytes = res.raw.opbytes;
            type = "UNDELEGATE";
            break;
          default:
            throw new Error("not supported");
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
          id: `${accountId}-${txHash}-${type}`,
          hash: txHash,
          type,
          value: transaction.amount,
          fee: fees,
          extra: {
            storageLimit: transaction.storageLimit,
            gasLimit: transaction.gasLimit,
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
            signature: opbytes,
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
