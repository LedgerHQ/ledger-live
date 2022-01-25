import CosmosApp from "@ledgerhq/hw-app-cosmos";
import { makeSignOperation } from "../../libcore/signOperation";
import buildTransaction from "./libcore-buildTransaction";
import type { Transaction, CoreCosmosLikeTransaction } from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import { OperationType } from "../../types";

async function signTransaction({
  account,
  transport,
  transaction,
  coreTransaction,
  isCancelled,
  onDeviceSignatureGranted,
  onDeviceSignatureRequested,
}) {
  const { freshAddressPath, spendableBalance, id, freshAddress } = account;
  const hwApp = new CosmosApp(transport);
  const serialized = await coreTransaction.serializeForSignature();
  onDeviceSignatureRequested();
  const { signature } = await hwApp.sign(freshAddressPath, serialized);
  onDeviceSignatureGranted();

  if (signature) {
    await coreTransaction.setDERSignature(signature.toString("hex"));
  } else {
    throw new Error("Cosmos: no Signature Found");
  }

  if (isCancelled()) return;
  // Serialize the transaction to be broadcast
  // @param mode The supported broadcast modes include
  //        "block"(return after tx commit), (https://docs.cosmos.network/master/basics/tx-lifecycle.html#commit)
  //        "sync"(return afer CheckTx), (https://docs.cosmos.network/master/basics/tx-lifecycle.html#types-of-checks) and
  //        "async"(return right away).
  const hex = await coreTransaction.serializeForBroadcast("sync");
  if (isCancelled()) return;
  const feesRaw = await coreTransaction.getFee();
  if (isCancelled()) return;
  const fee = await libcoreAmountToBigNumber(feesRaw);
  if (isCancelled()) return;
  const recipients = [transaction.recipient];
  if (isCancelled()) return;
  const senders = [freshAddress];
  if (isCancelled()) return;
  const type: OperationType =
    transaction.mode === "undelegate"
      ? "UNDELEGATE"
      : transaction.mode === "delegate"
      ? "DELEGATE"
      : transaction.mode === "redelegate"
      ? "REDELEGATE"
      : ["claimReward", "claimRewardCompound"].includes(transaction.mode)
      ? "REWARD"
      : "OUT";
  const extra = {};

  if (transaction.mode === "redelegate") {
    Object.assign(extra, {
      cosmosSourceValidator: transaction.cosmosSourceValidator,
    });
  }

  if (transaction.mode !== "send") {
    Object.assign(extra, {
      validators: transaction.validators,
    });
  }

  const op = {
    id: `${id}--${type}`,
    hash: "",
    type,
    value: transaction.useAllAmount
      ? spendableBalance
      : transaction.amount.plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: id,
    date: new Date(),
    extra,
  };
  return {
    operation: op,
    expirationDate: null,
    signature: hex,
  };
}

export default makeSignOperation<Transaction, CoreCosmosLikeTransaction>({
  buildTransaction,
  signTransaction,
});
