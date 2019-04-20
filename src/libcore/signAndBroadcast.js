// @flow

import { Observable, from } from "rxjs";
import { BigNumber } from "bignumber.js";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { UpdateYourApp } from "@ledgerhq/errors";
import type { Account, Operation, TokenAccount } from "../types";
import { getWalletName } from "../account";
import { withDevice } from "../hw/deviceAccess";
import { log } from "../logs";
import type { SignAndBroadcastEvent } from "../bridge/types";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { libcoreAmountToBigNumber } from "./buildBigNumber";
import { remapLibcoreErrors } from "./errors";
import { withLibcoreF } from "./access";
import signTransaction from "./signTransaction";
import buildTransaction from "./buildTransaction";
import { getEnv } from "../env";
import type { Transaction } from "./buildTransaction";

export type Input = {
  // the account to use for the transaction
  account: Account,
  // tokenAccount if provided will use this account instead and account is just the parent
  tokenAccount?: ?TokenAccount,
  // all data of the transaction
  transaction: Transaction,
  // device identified to sign the transaction with
  deviceId: string
};

async function bitcoin({
  account: { id: accountId },
  signedTransaction,
  builded,
  coreAccount,
  transaction
}) {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();

  const txHash = getEnv("DISABLE_TRANSACTION_BROADCAST")
    ? ""
    : await bitcoinLikeAccount.broadcastRawTransaction(signedTransaction);

  const sendersInput = await builded.getInputs();
  const senders = (await Promise.all(
    sendersInput.map(senderInput => senderInput.getAddress())
  )).filter(Boolean);

  const recipientsOutput = await builded.getOutputs();
  const recipients = (await Promise.all(
    recipientsOutput.map(recipientOutput => recipientOutput.getAddress())
  )).filter(Boolean);

  const coreAmountFees = await builded.getFees();
  if (!coreAmountFees) {
    throw new Error("signAndBroadcast: fees should not be undefined");
  }
  const fee = await libcoreAmountToBigNumber(coreAmountFees);

  // NB we don't check isCancelled() because the broadcast is not cancellable now!
  const op: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    type: "OUT",
    value: BigNumber(transaction.amount).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    extra: {}
  };

  return op;
}

async function ethereum({
  account: { id: accountId, freshAddress },
  signedTransaction,
  builded,
  coreAccount,
  transaction
}) {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();

  const txHash = getEnv("DISABLE_TRANSACTION_BROADCAST")
    ? ""
    : await ethereumLikeAccount.broadcastRawTransaction(signedTransaction);
  const senders = [freshAddress];
  const receiver = await builded.getReceiver();
  const recipients = [await receiver.toEIP55()];
  const gasPrice = await libcoreAmountToBigNumber(await builded.getGasPrice());
  const gasLimit = await libcoreAmountToBigNumber(await builded.getGasLimit());
  const fee = gasPrice.times(gasLimit);

  const op: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    type: "OUT",
    value: BigNumber(transaction.amount).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    extra: {}
  };

  return op;
}

const byFamily = {
  bitcoin,
  ethereum
};

const doSignAndBroadcast = withLibcoreF(
  core => async ({
    account,
    tokenAccount,
    transaction,
    deviceId,
    isCancelled,
    onSigning,
    onSigned,
    onOperationBroadcasted
  }: {
    account: Account,
    tokenAccount: ?TokenAccount,
    transaction: Transaction,
    deviceId: string,
    isCancelled: () => boolean,
    onSigning: () => void,
    onSigned: string => void,
    onOperationBroadcasted: (optimisticOp: Operation) => void
  }): Promise<void> => {
    if (isCancelled()) return;
    const { currency, derivationMode, seedIdentifier, index } = account;

    const walletName = getWalletName({
      currency,
      seedIdentifier,
      derivationMode
    });

    const coreWallet = await getOrCreateWallet({
      core,
      walletName,
      currency,
      derivationMode
    });
    if (isCancelled()) return;
    const coreAccount = await coreWallet.getAccount(index);
    if (isCancelled()) return;
    const coreCurrency = await coreWallet.getCurrency();
    if (isCancelled()) return;

    const builded = await buildTransaction({
      account,
      tokenAccount,
      core,
      coreCurrency,
      coreAccount,
      transaction,
      isPartial: false,
      isCancelled
    });

    if (isCancelled() || !builded) return;

    const signedTransaction = await withDevice(deviceId)(transport =>
      from(
        signTransaction({
          account,
          tokenAccount,
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
      tokenAccount,
      signedTransaction,
      builded,
      coreAccount,
      transaction
    });

    if (!op) return;

    onOperationBroadcasted(op);
  }
);

export default ({
  account,
  tokenAccount,
  transaction,
  deviceId
}: Input): Observable<SignAndBroadcastEvent> =>
  Observable.create(o => {
    let unsubscribed = false;
    const isCancelled = () => unsubscribed;
    doSignAndBroadcast({
      account,
      tokenAccount,
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
    }).then(() => o.complete(), e => o.error(remapLibcoreErrors(e)));

    return () => {
      unsubscribed = true;
    };
  });
