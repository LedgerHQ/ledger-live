import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import {
  bigNumberToLibcoreAmount,
  bigNumberToLibcoreBigInt,
} from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type {
  CoreTezosLikeOriginatedAccount,
  CoreTezosLikeAccount,
  CoreTezosLikeTransaction,
  Transaction,
} from "./types";
import { tezosOperationTag } from "./types";
import { upperModulo } from "../../modulo";

export async function tezosBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isCancelled,
}: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  coreCurrency: CoreCurrency;
  transaction: Transaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}): Promise<CoreTezosLikeTransaction | null | undefined> {
  const { currency } = account;
  const { recipient, fees, gasLimit, storageLimit, subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find((t) => t.id === subAccountId)
    : null;
  let tezosAccount:
    | (CoreTezosLikeAccount | null | undefined)
    | (CoreTezosLikeOriginatedAccount | null | undefined);
  const tezosLikeAccount = await coreAccount.asTezosLikeAccount();
  if (isCancelled()) return;

  if (subAccount && subAccount.type === "ChildAccount") {
    const accounts = await tezosLikeAccount.getOriginatedAccounts();

    for (const a of accounts) {
      const addr = await a.getAddress();

      if (addr === subAccount.address) {
        tezosAccount = a;
        break;
      }
    }

    invariant(tezosAccount, "sub account not found " + subAccount.id);
  } else {
    tezosAccount = tezosLikeAccount;
  }

  if (transaction.mode !== "undelegate") {
    await isValidRecipient({
      currency,
      recipient,
    });
    if (isCancelled()) return;
  }

  if (!fees || !gasLimit || !storageLimit) {
    throw new FeeNotLoaded();
  }

  const feesAmount = await bigNumberToLibcoreAmount(core, coreCurrency, fees);
  if (isCancelled()) return;
  let gasLimitRounded = gasLimit;

  if (["delegate", "undelegate"].includes(transaction.mode)) {
    gasLimitRounded = upperModulo(
      gasLimit,
      new BigNumber(136),
      new BigNumber(1000)
    );
  }

  const gasLimitAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    gasLimitRounded
  );
  if (isCancelled()) return;
  const storageBigInt = await bigNumberToLibcoreBigInt(core, storageLimit);
  if (isCancelled()) return;
  const transactionBuilder = await (
    tezosAccount as CoreTezosLikeAccount
  ).buildTransaction();
  if (isCancelled()) return;
  let type;

  switch (transaction.mode) {
    case "send":
      type = tezosOperationTag.OPERATION_TAG_TRANSACTION;
      break;

    case "delegate":
    case "undelegate":
      invariant(
        !transaction.useAllAmount,
        "send max can't be used in delegation context"
      );
      invariant(
        transaction.amount.isZero(),
        "amount must be ZERO in delegation context"
      );
      type = tezosOperationTag.OPERATION_TAG_DELEGATION;
      break;

    default:
      throw new Error("Unsupported transaction.mode = " + transaction.mode);
  }

  await transactionBuilder.setType(type);
  if (isCancelled()) return;

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(recipient);
    if (isCancelled()) return;
  } else {
    if (!transaction.amount) throw new Error("amount is missing");
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreCurrency,
      new BigNumber(transaction.amount)
    );
    if (isCancelled()) return;
    await transactionBuilder.sendToAddress(amount, recipient);
    if (isCancelled()) return;
  }

  await transactionBuilder.setGasLimit(gasLimitAmount);
  if (isCancelled()) return;
  await transactionBuilder.setFees(feesAmount);
  if (isCancelled()) return;
  await transactionBuilder.setStorageLimit(storageBigInt);
  if (isCancelled()) return;
  const builded = await transactionBuilder.build();
  if (isCancelled()) return;
  return builded;
}

export default tezosBuildTransaction;
