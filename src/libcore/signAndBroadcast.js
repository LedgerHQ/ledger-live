// @flow

import { BigNumber } from "bignumber.js";
import { StatusCodes } from "@ledgerhq/hw-transport";
import Btc from "@ledgerhq/hw-app-btc";
import { Observable } from "rxjs";
import { isSegwitDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import { FeeNotLoaded, UpdateYourApp } from "@ledgerhq/live-common/lib/errors";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import type {
  Operation,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { getWalletName } from "@ledgerhq/live-common/lib/account";
import { open } from "@ledgerhq/live-common/lib/hw";
import { getOrCreateWallet } from "./getOrCreateWallet";
import {
  libcoreAmountToBigNumber,
  bigNumberToLibcoreAmount,
} from "./buildBigNumber";
import type { SignAndBroadcastEvent } from "../bridge/types";
import { remapLibcoreErrors } from "./errors";
import { getValue } from "./specific";
import { withLibcoreF } from "./access";

type Transaction = {
  amount: BigNumber,
  recipient: string,
  feePerByte: ?BigNumber,
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
  deviceId: string,
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
  deviceId,
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
          operation,
        });
      },
    }).then(() => o.complete(), e => o.error(remapLibcoreErrors(e)));

    return () => {
      unsubscribed = true;
    };
  });

async function signTransaction({
  core,
  isCancelled,
  hwApp,
  currency,
  blockHeight,
  coreTransaction,
  derivationMode,
  sigHashType,
  hasTimestamp,
  onSigning,
}: {
  core: *,
  isCancelled: () => boolean,
  hwApp: Btc,
  currency: CryptoCurrency,
  blockHeight: number,
  coreTransaction: *,
  derivationMode: DerivationMode,
  sigHashType: number,
  hasTimestamp: boolean,
  onSigning: () => void,
}) {
  const additionals = [];
  let expiryHeight;
  if (currency.id === "bitcoin_cash" || currency.id === "bitcoin_gold")
    additionals.push("bip143");
  if (currency.id === "zcash") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    if (blockHeight >= 419200) {
      additionals.push("sapling");
    }
  } else if (currency.id === "decred") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    additionals.push("decred");
  }

  const rawInputs = await core.coreBitcoinLikeTransaction.getInputs(
    coreTransaction,
  );
  if (isCancelled()) return;

  const hasExtraData = currency.id === "zcash";

  // TODO handle isCancelled

  const inputs = await Promise.all(
    rawInputs.map(async input => {
      const hexPreviousTransaction = getValue(
        await core.coreBitcoinLikeInput.getPreviousTransaction(input),
      ).replace(/[< >]/g, ""); // FIXME FIXME FIXME
      const previousTransaction = hwApp.splitTransaction(
        hexPreviousTransaction,
        currency.supportsSegwit,
        hasTimestamp,
        hasExtraData,
        additionals,
      );

      const outputIndex = (await core.coreBitcoinLikeInput.getPreviousOutputIndex(
        input,
      )).value;

      const sequence = (await core.coreBitcoinLikeInput.getSequence(input))
        .value;

      return [
        previousTransaction,
        outputIndex,
        undefined, // we don't use that TODO: document
        sequence, // 0xffffffff,
      ];
    }),
  );
  if (isCancelled()) return;

  const associatedKeysets = await Promise.all(
    rawInputs.map(async input => {
      const derivationPaths = await core.coreBitcoinLikeInput.getDerivationPath(
        input,
      );
      return (await core.coreDerivationPath.toString(derivationPaths[0])).value;
    }),
  );
  if (isCancelled()) return;

  const outputs = await core.coreBitcoinLikeTransaction.getOutputs(
    coreTransaction,
  );
  if (isCancelled()) return;

  let changePath;

  for (const o of outputs) {
    const derivationPath = await core.coreBitcoinLikeOutput.getDerivationPath(
      o,
    );
    if (isCancelled()) return;

    const isDerivationPathNull = await core.coreDerivationPath.isNull(
      derivationPath,
    );

    if (!isDerivationPathNull && derivationPath.uid) {
      const strDerivationPath = (await core.coreDerivationPath.toString(
        derivationPath,
      )).value;
      if (isCancelled()) return;

      const derivationArr = strDerivationPath.split("/");
      if (derivationArr[derivationArr.length - 2] === "1") {
        changePath = strDerivationPath;
        break;
      }
    }
  }

  const outputScriptHex = (await core.coreBitcoinLikeTransaction.serializeOutputs(
    coreTransaction,
  )).value.replace(/[< >]/g, ""); // FIXME
  if (isCancelled()) return;

  const initialTimestamp = hasTimestamp
    ? (await core.coreBitcoinLikeTransaction.getTimestamp(coreTransaction))
        .value
    : undefined;
  if (isCancelled()) return;

  const lockTime = undefined;

  onSigning();

  const signedTransaction = await hwApp.createPaymentTransactionNew(
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    isSegwitDerivationMode(derivationMode),
    initialTimestamp,
    additionals,
    expiryHeight,
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
    onOperationBroadcasted,
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
    onOperationBroadcasted: (optimisticOp: Operation) => void,
  }): Promise<void> => {
    const { feePerByte } = transaction;
    if (!feePerByte) throw FeeNotLoaded();
    if (isCancelled()) return;

    const walletName = getWalletName({
      currency,
      seedIdentifier,
      derivationMode,
    });

    const coreWallet = await getOrCreateWallet({
      core,
      walletName,
      currency,
      derivationMode,
    });
    if (isCancelled()) return;
    const coreAccount = await core.coreWallet.getAccount(coreWallet, index);
    if (isCancelled()) return;
    const bitcoinLikeAccount = await core.coreAccount.asBitcoinLikeAccount(
      coreAccount,
    );
    if (isCancelled()) return;
    const coreWalletCurrency = await core.coreWallet.getCurrency(coreWallet);
    if (isCancelled()) return;
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreWalletCurrency,
      transaction.amount,
    );
    if (isCancelled()) return;
    const fees = await bigNumberToLibcoreAmount(
      core,
      coreWalletCurrency,
      feePerByte,
    );
    if (isCancelled()) return;
    const transactionBuilder = await core.coreBitcoinLikeAccount.buildTransaction(
      bitcoinLikeAccount,
    );
    if (isCancelled()) return;

    await core.coreBitcoinLikeTransactionBuilder.sendToAddress(
      transactionBuilder,
      amount,
      transaction.recipient,
    );
    if (isCancelled()) return;
    await core.coreBitcoinLikeTransactionBuilder.pickInputs(
      transactionBuilder,
      0,
      0xffffff,
    );
    if (isCancelled()) return;

    await core.coreBitcoinLikeTransactionBuilder.setFeesPerByte(
      transactionBuilder,
      fees,
    );
    if (isCancelled()) return;

    const builded = await core.coreBitcoinLikeTransactionBuilder.build(
      transactionBuilder,
    );
    if (isCancelled()) return;

    const networkParams = await core.coreCurrency.getBitcoinLikeNetworkParameters(
      coreWalletCurrency,
    );
    if (isCancelled()) return;

    const sigHashType = (await core.coreBitcoinLikeNetworkParameters.getSigHash(
      networkParams,
    )).value.replace(/[< >]/g, ""); // FIXME FIXME FIXME;
    if (isCancelled()) return;

    const hasTimestamp = (await core.coreBitcoinLikeNetworkParameters.getUsesTimestampedTransaction(
      networkParams,
    )).value;
    if (isCancelled()) return;

    const transport = await open(deviceId);
    if (isCancelled()) return;

    let signedTransaction;
    try {
      signedTransaction = await signTransaction({
        core,
        isCancelled,
        hwApp: new Btc(transport),
        currency,
        blockHeight,
        coreTransaction: builded,
        sigHashType: parseInt(sigHashType, 16),
        hasTimestamp,
        derivationMode,
        onSigning,
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

    onSigned();

    const txHash = getValue(
      await core.coreBitcoinLikeAccount.broadcastRawTransaction(
        bitcoinLikeAccount,
        signedTransaction,
      ),
    );
    if (isCancelled()) return;

    const sendersInput = await core.coreBitcoinLikeTransaction.getInputs(
      builded,
    );
    if (isCancelled()) return;

    const senders = (await Promise.all(
      sendersInput.map(
        async senderInput =>
          (await core.coreBitcoinLikeInput.getAddress(senderInput)).value,
      ),
    )).filter(Boolean);
    if (isCancelled()) return;

    const recipientsOutput = await core.coreBitcoinLikeTransaction.getOutputs(
      builded,
    );
    if (isCancelled()) return;

    const recipients = (await Promise.all(
      recipientsOutput.map(
        async recipientOutput =>
          (await core.coreBitcoinLikeOutput.getAddress(recipientOutput)).value,
      ),
    )).filter(Boolean);
    if (isCancelled()) return;

    const coreAmountFees = await core.coreBitcoinLikeTransaction.getFees(
      builded,
    );
    if (isCancelled()) return;

    const fee = await await libcoreAmountToBigNumber(core, coreAmountFees);
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
      extra: {},
    };

    onOperationBroadcasted(op);
  },
);
