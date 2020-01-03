// @flow

import { BigNumber } from "bignumber.js";
import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import { isSegwitDerivationMode } from "../../derivation";
import type {
  CoreBitcoinLikeTransaction,
  CoreBitcoinLikeInput,
  CoreBitcoinLikeOutput,
  Transaction
} from "./types";
import type { Operation } from "../../types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import { makeSignOperation } from "../../libcore/signOperation";
import buildTransaction from "./libcore-buildTransaction";

async function signTransaction({
  account,
  isCancelled,
  transport,
  currency,
  coreCurrency,
  transaction,
  coreTransaction,
  derivationMode,
  onDeviceStreaming,
  onDeviceSignatureRequested,
  onDeviceSignatureGranted
}) {
  log("hw", `signTransaction ${currency.id} for account ${account.id}`);

  const networkParams = await coreCurrency.getBitcoinLikeNetworkParameters();
  if (isCancelled()) return;

  const sigHashTypeHex = await networkParams.getSigHash();
  const sigHashType = parseInt(sigHashTypeHex, 16);
  if (isNaN(sigHashType)) {
    throw new Error("sigHashType should not be NaN");
  }
  if (isCancelled()) return;

  const hasTimestamp = await networkParams.getUsesTimestampedTransaction();
  if (isCancelled()) return;

  const hwApp = new Btc(transport);
  const additionals = [];
  let expiryHeight;
  if (currency.id === "bitcoin_cash" || currency.id === "bitcoin_gold")
    additionals.push("bip143");
  if (currency.id === "zcash" || currency.id === "komodo") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    if (account.blockHeight >= 419200) {
      additionals.push("sapling");
    }
  } else if (currency.id === "decred") {
    expiryHeight = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    additionals.push("decred");
  } else if (currency.id === "stealthcoin") {
    additionals.push("stealthcoin");
  }
  if (account.derivationMode === "native_segwit") {
    additionals.push("bech32");
  }

  const rawInputs: CoreBitcoinLikeInput[] = await coreTransaction.getInputs();
  if (isCancelled()) return;

  const hasExtraData = currency.id === "zcash" || currency.id === "komodo";

  const inputs = await Promise.all(
    rawInputs.map(async (input, i) => {
      const hexPreviousTransaction = await input.getPreviousTransaction();
      log("libcore", "splitTransaction " + String(hexPreviousTransaction));
      // v1 of XST txs have timestamp but not v2
      const inputHasTimestamp =
        (currency.id === "stealthcoin" &&
          hexPreviousTransaction.slice(0, 2) === "01") ||
        hasTimestamp;

      log("hw", `splitTransaction`, {
        hexPreviousTransaction,
        supportsSegwit: currency.supportsSegwit,
        inputHasTimestamp,
        hasExtraData,
        additionals
      });
      const previousTransaction = hwApp.splitTransaction(
        hexPreviousTransaction,
        currency.supportsSegwit,
        inputHasTimestamp,
        hasExtraData,
        additionals
      );

      const outputIndex = await input.getPreviousOutputIndex();

      const sequence = await input.getSequence();

      log("libcore", "inputs[" + i + "]", {
        previousTransaction: JSON.stringify(previousTransaction),
        outputIndex,
        sequence
      });
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

  log("hw", `createPaymentTransactionNew`, {
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    isSegwit: isSegwitDerivationMode(derivationMode),
    timestamp: initialTimestamp || undefined,
    additionals,
    expiryHeight: expiryHeight && expiryHeight.toString("hex")
  });

  const signature = await hwApp.createPaymentTransactionNew({
    // $FlowFixMe
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit: isSegwitDerivationMode(derivationMode),
    initialTimestamp: initialTimestamp || undefined,
    additionals,
    expiryHeight,
    onDeviceSignatureGranted,
    onDeviceSignatureRequested,
    onDeviceStreaming
  });

  const sendersInput = await coreTransaction.getInputs();
  const senders = (
    await Promise.all(sendersInput.map(senderInput => senderInput.getAddress()))
  ).filter(Boolean);

  const recipientsOutput = await coreTransaction.getOutputs();
  const recipients = (
    await Promise.all(
      recipientsOutput.map(recipientOutput => recipientOutput.getAddress())
    )
  ).filter(Boolean);

  const coreAmountFees = await coreTransaction.getFees();
  if (!coreAmountFees) {
    throw new Error("signAndBroadcast: fees should not be undefined");
  }
  const fee = await libcoreAmountToBigNumber(coreAmountFees);

  const txHash = ""; // will be resolved in broadcast()

  const operation: $Exact<Operation> = {
    id: `${account.id}-${txHash}-OUT`,
    hash: txHash,
    type: "OUT",
    value: BigNumber(transaction.amount).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: account.id,
    date: new Date(),
    extra: {}
  };

  return {
    operation,
    expirationDate: null,
    signature
  };
}

export default makeSignOperation<Transaction, CoreBitcoinLikeTransaction>({
  buildTransaction,
  signTransaction
});
