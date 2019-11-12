// @flow

import { Observable, from } from "rxjs";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { UpdateYourApp } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  Account,
  Operation,
  Transaction,
  SignAndBroadcastEvent
} from "../types";
import { withDevice } from "../hw/deviceAccess";
import { toTransactionRaw } from "../transaction";
import { getCoreAccount } from "./getCoreAccount";
import { remapLibcoreErrors } from "./errors";
import { withLibcoreF } from "./access";
import signTransaction from "./signTransaction";
import buildTransaction from "./buildTransaction";
import byFamily from "../generated/libcore-signAndBroadcast";

export type Input = {
  // the account to use for the transaction
  account: Account,
  // all data of the transaction
  transaction: Transaction,
  // device identified to sign the transaction with
  deviceId: string
};

const doSignAndBroadcast = withLibcoreF(
  core => async ({
    account,
    transaction,
    deviceId,
    isCancelled,
    onSigning,
    onSigned,
    onOperationBroadcasted
  }: {
    account: Account,
    transaction: Transaction,
    deviceId: string,
    isCancelled: () => boolean,
    onSigning: () => void,
    onSigned: string => void,
    onOperationBroadcasted: (optimisticOp: Operation) => void
  }): Promise<void> => {
    if (isCancelled()) return;
    const { currency, derivationMode } = account;

    const { coreAccount, coreWallet } = await getCoreAccount(core, account);
    if (isCancelled()) return;

    const coreCurrency = await coreWallet.getCurrency();
    if (isCancelled()) return;

    log("libcore", "buildTransaction", toTransactionRaw(transaction));

    const builded = await buildTransaction({
      account,
      core,
      coreCurrency,
      coreAccount,
      transaction,
      isPartial: false,
      isCancelled
    });

    if (isCancelled() || !builded) return;

    log("libcore", "signing transaction...");
    const signedTransaction = await withDevice(deviceId)(transport =>
      from(
        signTransaction({
          account,
          subAccountId: transaction.subAccountId,
          isCancelled,
          transport,
          currency,
          derivationMode,
          coreCurrency,
          coreTransaction: builded,
          onSigning
        }).catch(e => {
          if (e && e.statusCode === StatusCodes.INCORRECT_P1_P2) {
            throw new UpdateYourApp(`UpdateYourApp ${currency.id}`, currency);
          }
          throw e;
        })
      )
    ).toPromise();

    log("libcore", "signed transaction: " + signedTransaction);

    if (isCancelled()) return;

    if (!signedTransaction) return;

    onSigned(signedTransaction);

    const f = byFamily[account.currency.family];
    if (!f) {
      throw new Error(
        "signAndBroadcast does not support currency " + account.currency.id
      );
    }

    const op = await f({
      account,
      signedTransaction,
      builded,
      coreAccount,
      transaction
    });

    log("libcore", "op builded: " + op.id);

    if (!op) return;

    onOperationBroadcasted(op);
  }
);

export default ({
  account,
  transaction,
  deviceId
}: Input): Observable<SignAndBroadcastEvent> =>
  Observable.create(o => {
    let unsubscribed = false;
    const isCancelled = () => unsubscribed;
    doSignAndBroadcast({
      account,
      transaction,
      deviceId,
      isCancelled,
      onSigning: () => {
        o.next({ type: "signing" });
      },
      onSigned: signedTransaction => {
        log("libcore", "signed transaction " + String(signedTransaction));
        o.next({ type: "signed" });
      },
      onOperationBroadcasted: operation => {
        log("libcore", "broadcasted to " + String(operation.hash));
        o.next({
          type: "broadcasted",
          operation
        });
      }
    }).then(
      () => o.complete(),
      e => o.error(remapLibcoreErrors(e))
    );

    return () => {
      unsubscribed = true;
    };
  });
