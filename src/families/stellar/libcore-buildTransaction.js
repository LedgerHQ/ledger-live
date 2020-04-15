// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "../../types";
import {
  bigNumberToLibcoreAmount,
  bigNumberToLibcoreBigInt,
  libcoreBigIntToBigNumber
} from "../../libcore/buildBigNumber";
import type {
  Core,
  CoreCurrency,
  CoreAccount,
  CoreWallet
} from "../../libcore/types";
import type {
  CoreStellarLikeTransaction,
  CoreStellarLikeTransactionBuilder,
  Transaction
} from "./types";

const setSequenceToTransactionBuilder = async (
  transactionBuilder,
  stellarLikeAccount,
  core
) => {
  // A transaction’s sequence number needs to match the account’s sequence number,
  // so we need to get the account’s current sequence number from the network and then
  // sequence number is required to be increased with every transaction
  const sequence = await stellarLikeAccount.getSequence();
  const sequenceBigNumber = await libcoreBigIntToBigNumber(sequence);
  const sequenceBigInt = await bigNumberToLibcoreBigInt(
    core,
    sequenceBigNumber.plus(1)
  );

  await transactionBuilder.setSequence(sequenceBigInt);
};

const setBaseFee = async (transactionBuilder, core, coreCurrency, fees) => {
  const feesAmount = await bigNumberToLibcoreAmount(core, coreCurrency, fees);
  await transactionBuilder.setBaseFee(feesAmount);
};

const setTransactionAmount = async (
  transactionBuilder,
  core,
  coreCurrency,
  transactionAmount,
  recipient
) => {
  const amount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(transactionAmount)
  );

  await transactionBuilder.addNativePayment(recipient, amount);
};

const setCreateAccount = async (
  transactionBuilder,
  core,
  coreCurrency,
  transactionAmount,
  recipient
) => {
  const amount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(transactionAmount)
  );

  await transactionBuilder.addCreateAccount(recipient, amount);
};

const setMemo = async (
  transactionBuilder: CoreStellarLikeTransactionBuilder,
  core: Core,
  memoType: string,
  memoValue: string
) => {
  switch (memoType) {
    case "MEMO_TEXT":
      await transactionBuilder.setTextMemo(memoValue.toString());
      break;

    case "MEMO_ID":
      await transactionBuilder.setNumberMemo(
        await bigNumberToLibcoreBigInt(core, BigNumber(memoValue.toString()))
      );
      break;

    case "MEMO_HASH":
      await transactionBuilder.setHashMemo(memoValue.toString());
      break;

    case "MEMO_RETURN":
      await transactionBuilder.setReturnMemo(memoValue.toString());
      break;

    default:
      break;
  }
};

export async function stellarBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  coreWallet,
  transaction,
  isCancelled
}: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  coreWallet: CoreWallet,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean
}): Promise<?CoreStellarLikeTransaction> {
  const { recipient, fees, memoType, memoValue } = transaction;
  if (!fees) {
    throw new FeeNotLoaded();
  }

  const stellarAccount = await coreAccount.asStellarLikeAccount();
  if (isCancelled()) return;

  const transactionBuilder = await stellarAccount.buildTransaction();
  if (isCancelled()) return;

  const stellarLikeWallet = await coreWallet.asStellarLikeWallet();
  const recipientExist = await stellarLikeWallet.exists(recipient);

  await setSequenceToTransactionBuilder(
    transactionBuilder,
    stellarAccount,
    core
  );
  if (isCancelled()) return;

  await setBaseFee(transactionBuilder, core, coreCurrency, fees);
  if (isCancelled()) return;

  let amount = BigNumber(0);
  const { useAllAmount, networkInfo } = transaction;

  invariant(networkInfo && networkInfo.family === "stellar", "stellar family");

  amount = useAllAmount
    ? account.balance.minus(networkInfo.baseReserve).minus(fees)
    : transaction.amount;

  if (!amount) throw new Error("amount is missing");

  if (memoType && memoValue)
    setMemo(transactionBuilder, core, memoType, memoValue);
  if (isCancelled()) return;

  if (recipientExist) {
    await setTransactionAmount(
      transactionBuilder,
      core,
      coreCurrency,
      amount,
      recipient
    );
  } else {
    await setCreateAccount(
      transactionBuilder,
      core,
      coreCurrency,
      amount,
      recipient
    );
  }
  if (isCancelled()) return;

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default stellarBuildTransaction;
