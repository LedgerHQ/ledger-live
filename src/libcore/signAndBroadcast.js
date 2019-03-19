// @flow

import { BigNumber } from "bignumber.js";
import { StatusCodes } from "@ledgerhq/hw-transport";
import Btc from "@ledgerhq/hw-app-btc";
import { Observable } from "rxjs";
import { isSegwitDerivationMode } from "../derivation";
import { FeeNotLoaded, UpdateYourApp } from "../errors";
import { getCryptoCurrencyById } from "../currencies";
import type { Operation, CryptoCurrency, DerivationMode } from "../types";
import { getWalletName } from "../account";
import { open } from "../hw";
import type { SignAndBroadcastEvent } from "../bridge/types";
import { getOrCreateWallet } from "./getOrCreateWallet";
import {
  libcoreAmountToBigNumber,
  bigNumberToLibcoreAmount
} from "./buildBigNumber";
import { remapLibcoreErrors } from "./errors";
import { withLibcoreF } from "./access";
import type {
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeInput,
  CoreBitcoinLikeOutput
} from "./types";

type Transaction = {
  amount: BigNumber,
  recipient: string,
  feePerByte: ?BigNumber
};

type Input = {
  accountId: string,
  blockHeight: number,
  currencyId: string,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  xpub: string,
  index: number,
  transaction: Transaction,
  deviceId: string
};

export default ({
  accountId,
  blockHeight,
  currencyId,
  derivationMode,
  seedIdentifier,
  xpub,
  index,
  transaction,
  deviceId
}: Input): Observable<SignAndBroadcastEvent> =>
  Observable.create(o => {
    let unsubscribed = false;
    const currency = getCryptoCurrencyById(currencyId);
    const isCancelled = () => unsubscribed;
    doSignAndBroadcast({
      accountId,
      currency,
      blockHeight,
      derivationMode,
      seedIdentifier,
      xpub,
      index,
      transaction,
      deviceId,
      isCancelled,
      onSigning: () => {
        o.next({ type: "signing" });
      },
      onSigned: () => {
        o.next({ type: "signed" });
      },
      onOperationBroadcasted: operation => {
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

async function signTransaction({
  isCancelled,
  hwApp,
  currency,
  blockHeight,
  coreTransaction,
  derivationMode,
  sigHashType,
  hasTimestamp,
  onSigning
}: {
  isCancelled: () => boolean,
  hwApp: Btc,
  currency: CryptoCurrency,
  blockHeight: number,
  coreTransaction: CoreBitcoinLikeTransaction,
  derivationMode: DerivationMode,
  sigHashType: number,
  hasTimestamp: boolean,
  onSigning: () => void
}) {
  const additionals = [];
  let expiryHeight;
  if (currency.id === "bitcoin_cash" || currency.id === "bitcoin_gold")
    additionals.push("bip143");
  if (currency.id === "zcash" || currency.id === "komodo") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    if (blockHeight >= 419200) {
      additionals.push("sapling");
    }
  } else if (currency.id === "decred") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    additionals.push("decred");
  }

  const rawInputs: CoreBitcoinLikeInput[] = await coreTransaction.getInputs();
  if (isCancelled()) return;

  const hasExtraData = currency.id === "zcash" || currency.id === "komodo";

  // TODO handle isCancelled

  const inputs = await Promise.all(
    rawInputs.map(async input => {
      const hexPreviousTransaction = await input.getPreviousTransaction();
      const previousTransaction = hwApp.splitTransaction(
        hexPreviousTransaction,
        currency.supportsSegwit,
        hasTimestamp,
        hasExtraData,
        additionals
      );

      const outputIndex = await input.getPreviousOutputIndex();

      const sequence = await input.getSequence();

      return [
        previousTransaction,
        outputIndex,
        undefined, // we don't use that TODO: document
        sequence // 0xffffffff,
      ];
    })
  );
  if (isCancelled()) return;

  const associatedKeysets = await Promise.all(
    rawInputs.map(async input => {
      const derivationPaths = await input.getDerivationPath();
      const [first] = derivationPaths;
      if (!first) throw new Error("unexpected empty derivationPaths");
      const r = await first.toString();
      return r;
    })
  );
  if (isCancelled()) return;

  const outputs: CoreBitcoinLikeOutput[] = await coreTransaction.getOutputs();
  if (isCancelled()) return;

  let changePath;

  for (const o of outputs) {
    const derivationPath = await o.getDerivationPath();
    if (isCancelled()) return;

    if (derivationPath) {
      const isDerivationPathNull = await derivationPath.isNull();
      if (!isDerivationPathNull) {
        const strDerivationPath = await derivationPath.toString();
        if (isCancelled()) return;

        const derivationArr = strDerivationPath.split("/");
        if (derivationArr[derivationArr.length - 2] === "1") {
          changePath = strDerivationPath;
          break;
        }
      }
    }
  }

  const outputScriptHex = await coreTransaction.serializeOutputs();
  if (isCancelled()) return;

  const initialTimestamp = hasTimestamp
    ? await coreTransaction.getTimestamp()
    : undefined;
  if (isCancelled()) return;

  // FIXME
  // should be `transaction.getLockTime()` as soon as lock time is
  // handled by libcore (actually: it always returns a default value
  // and that caused issue with zcash (see #904))
  let lockTime;

  // Set lockTime for Komodo to enable reward claiming on UTXOs created by
  // Ledger Live. We should only set this if the currency is Komodo and
  // lockTime isn't already defined.
  if (currency.id === "komodo" && lockTime === undefined) {
    const unixtime = Math.floor(Date.now() / 1000);
    lockTime = unixtime - 777;
  }

  const signedTransaction = await hwApp.createPaymentTransactionNew(
    // $FlowFixMe not sure what's wrong
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    isSegwitDerivationMode(derivationMode),
    initialTimestamp || undefined,
    additionals,
    expiryHeight
  );

  return signedTransaction; // eslint-disable-line
}

const doSignAndBroadcast = withLibcoreF(
  core => async ({
    accountId,
    derivationMode,
    blockHeight,
    seedIdentifier,
    currency,
    xpub,
    index,
    transaction,
    deviceId,
    isCancelled,
    onSigning,
    onSigned,
    onOperationBroadcasted
  }: {
    accountId: string,
    derivationMode: DerivationMode,
    seedIdentifier: string,
    blockHeight: number,
    currency: CryptoCurrency,
    xpub: string,
    index: number,
    transaction: Transaction,
    deviceId: string,
    isCancelled: () => boolean,
    onSigning: () => void,
    onSigned: () => void,
    onOperationBroadcasted: (optimisticOp: Operation) => void
  }): Promise<void> => {
    const { feePerByte } = transaction;
    if (!feePerByte) throw FeeNotLoaded();
    if (isCancelled()) return;

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
    const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
    if (isCancelled()) return;
    const coreWalletCurrency = await coreWallet.getCurrency();
    if (isCancelled()) return;
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreWalletCurrency,
      transaction.amount
    );
    if (isCancelled()) return;
    const fees = await bigNumberToLibcoreAmount(
      core,
      coreWalletCurrency,
      feePerByte
    );
    if (isCancelled()) return;
    const isPartial = false;
    const transactionBuilder = await bitcoinLikeAccount.buildTransaction(
      isPartial
    );
    if (isCancelled()) return;

    await transactionBuilder.sendToAddress(amount, transaction.recipient);
    if (isCancelled()) return;

    await transactionBuilder.pickInputs(0, 0xffffff);
    if (isCancelled()) return;

    await transactionBuilder.setFeesPerByte(fees);
    if (isCancelled()) return;

    const builded = await transactionBuilder.build();
    if (isCancelled()) return;

    const networkParams = await coreWalletCurrency.getBitcoinLikeNetworkParameters();
    if (isCancelled()) return;

    const sigHashType = await networkParams.getSigHash();
    if (isCancelled()) return;

    const hasTimestamp = await networkParams.getUsesTimestampedTransaction();
    if (isCancelled()) return;

    const transport = await open(deviceId);
    if (isCancelled()) return;

    let signedTransaction;
    try {
      signedTransaction = await signTransaction({
        isCancelled,
        hwApp: new Btc(transport),
        currency,
        blockHeight,
        coreTransaction: builded,
        sigHashType: parseInt(sigHashType, 16),
        hasTimestamp,
        derivationMode,
        onSigning
      }).catch(e => {
        if (e && e.statusCode === StatusCodes.INCORRECT_P1_P2) {
          throw new UpdateYourApp(`UpdateYourApp ${currency.id}`, currency);
        }
        throw e;
      });
    } finally {
      transport.close();
    }
    if (isCancelled()) return;

    if (!signedTransaction) return;

    onSigned();

    const txHash = await bitcoinLikeAccount.broadcastRawTransaction(
      signedTransaction
    );
    if (isCancelled()) return;

    const sendersInput = await builded.getInputs();
    if (isCancelled()) return;

    const senders = (await Promise.all(
      sendersInput.map(senderInput => senderInput.getAddress())
    )).filter(Boolean);
    if (isCancelled()) return;

    const recipientsOutput = await builded.getOutputs();
    if (isCancelled()) return;

    const recipients = (await Promise.all(
      recipientsOutput.map(recipientOutput => recipientOutput.getAddress())
    )).filter(Boolean);
    if (isCancelled()) return;

    const coreAmountFees = await builded.getFees();
    if (isCancelled()) return;
    if (!coreAmountFees) {
      throw new Error("signAndBroadcast: fees should not be undefined");
    }

    const fee = await libcoreAmountToBigNumber(core, coreAmountFees);
    if (isCancelled()) return;

    // NB we don't check isCancelled() because the broadcast is not cancellable now!
    const op: $Exact<Operation> = {
      id: `${xpub}-${txHash}-OUT`,
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

    onOperationBroadcasted(op);
  }
);
