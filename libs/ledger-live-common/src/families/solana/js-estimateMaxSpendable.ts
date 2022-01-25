import type { AccountBridge } from "../../types";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { ChainAPI } from "./api";

const estimateMaxSpendableWithAPI = async (
  {
    account,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
  api: ChainAPI
): Promise<BigNumber> => {
  const feeCalculator =
    transaction?.feeCalculator ?? (await api.getTxFeeCalculator());

  switch (account.type) {
    case "Account":
      return BigNumber.max(
        account.balance.minus(feeCalculator.lamportsPerSignature),
        0
      );
    case "TokenAccount":
      return account.balance;
  }

  throw new Error("not supported account type");
};

export default estimateMaxSpendableWithAPI;
