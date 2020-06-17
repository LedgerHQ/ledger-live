// @flow
import type { Transaction, CoreCosmosLikeTransaction } from "./types";
import type { Account } from "../../types";
import type { Core, CoreAccount, CoreCurrency } from "../../libcore/types";

import {
  bigNumberToLibcoreAmount,
  libcoreBigIntToBigNumber,
} from "../../libcore/buildBigNumber";
import { BigNumber } from "bignumber.js";
import { cosmosCreateMessage } from "./message";
import { getEnv } from "../../env";
import { promiseAllBatched } from "../../promise";
import { getMaxEstimatedBalance } from "./logic";
import network from "../../network";
import { FeesNotLoaded } from "@ledgerhq/errors";

const getBaseApiUrl = () =>
  getEnv("API_COSMOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT");

async function fetch(url: string) {
  const { data } = await network({
    method: "GET",
    url,
  });

  return data.result;
}

export async function cosmosBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isCancelled,
  isPartial, // is true if we just want to estimate fees and gas
}: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean,
}): Promise<?CoreCosmosLikeTransaction> {
  const { gas, memo } = transaction;

  const cosmosLikeAccount = await coreAccount.asCosmosLikeAccount();
  if (isCancelled()) return;

  const transactionBuilder = await cosmosLikeAccount.buildTransaction();
  if (isCancelled()) return;

  let messages = await cosmosCreateMessage(
    account.freshAddress,
    {
      ...transaction,
      amount: transaction.useAllAmount
        ? getMaxEstimatedBalance(account, BigNumber(0))
        : transaction.amount,
    },
    core
  );

  const memoTransaction = memo || "";
  await transactionBuilder.setMemo(memoTransaction);

  // Gas
  let estimatedGas: BigNumber;

  if (isPartial) {
    const gasRequest = await core.CosmosGasLimitRequest.init(
      memoTransaction,
      messages,
      getEnv("COSMOS_GAS_AMPLIFIER")
    );
    estimatedGas = await libcoreBigIntToBigNumber(
      await cosmosLikeAccount.estimateGas(gasRequest)
    );
  } else {
    estimatedGas = gas || BigNumber(0);
  }

  if (!estimatedGas.gt(0)) {
    throw new FeesNotLoaded();
  }

  const gasAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    estimatedGas
  );
  if (isCancelled()) return;

  await transactionBuilder.setGas(gasAmount);

  const gasPrice = getEnv("COSMOS_GAS_PRICE");

  const feesBigNumber = estimatedGas
    .multipliedBy(gasPrice)
    .integerValue(BigNumber.ROUND_CEIL);

  const feesAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    feesBigNumber
  );
  if (isCancelled()) return;
  await transactionBuilder.setFee(feesAmount);

  if (transaction.useAllAmount && transaction.amount) {
    messages = await cosmosCreateMessage(
      account.freshAddress,
      {
        ...transaction,
        amount: getMaxEstimatedBalance(account, feesBigNumber),
      },
      core
    );
  }

  promiseAllBatched(
    3,
    messages,
    async (message) => await transactionBuilder.addMessage(message)
  );

  // Signature information
  const accountData = await fetch(
    `${getBaseApiUrl()}/auth/accounts/${account.freshAddress}`
  );
  const seq = accountData.value.sequence;
  const accNum = await cosmosLikeAccount.getAccountNumber();

  await transactionBuilder.setAccountNumber(accNum);
  await transactionBuilder.setSequence(seq);

  return await transactionBuilder.build();
}

export default cosmosBuildTransaction;
