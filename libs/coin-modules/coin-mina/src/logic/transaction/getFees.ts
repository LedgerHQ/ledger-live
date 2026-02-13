import BigNumber from "bignumber.js";
import { fetchTransactionMetadata } from "../../api";
import { Transaction } from "../../types/common";
import { isValidAddress } from "../utils";

export const getFees = async (
  txn: Transaction,
  address: string,
): Promise<{
  fee: BigNumber;
  accountCreationFee: BigNumber;
}> => {
  if (!txn.amount || !txn.recipient || !isValidAddress(txn.recipient)) {
    return { fee: txn.fees.fee, accountCreationFee: new BigNumber(0) };
  }

  const data = await fetchTransactionMetadata(
    address,
    txn.recipient,
    txn.fees.fee.toNumber(),
    txn.amount.toNumber(),
  );

  const accountCreationFee = data.metadata.account_creation_fee
    ? new BigNumber(data.metadata.account_creation_fee)
    : new BigNumber(0);

  return {
    fee: new BigNumber(data.suggested_fee[0].value),
    accountCreationFee,
  };
};
