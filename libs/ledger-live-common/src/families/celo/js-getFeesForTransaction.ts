import { BigNumber } from "bignumber.js";
import { Account, Transaction } from "../../types";
import { celoKit } from "./api/sdk";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { amount } = transaction;
  const kit = celoKit();

  // A workaround - estimating gas throws an error if value > funds
  const value = transaction.useAllAmount
    ? account.spendableBalance
    : BigNumber.minimum(amount, account.spendableBalance);

  const celoToken = await kit.contracts.getGoldToken();

  const celoTransaction = {
    from: account.freshAddress,
    to: celoToken.address,
    data: celoToken
      .transfer(transaction.recipient, value.toFixed())
      .txo.encodeABI(),
  };

  const gasPrice = new BigNumber(await kit.connection.gasPrice());
  const gas = await kit.connection.estimateGasWithInflationFactor(
    celoTransaction
  );

  return gasPrice.times(gas);
};

export default getFeesForTransaction;
