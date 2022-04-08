import type { AccountBridge } from "../../types";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { ChainAPI } from "./api";
import { getStakeAccountMinimumBalanceForRentExemption } from "./api/chain/web3";

const estimateMaxSpendableWithAPI = async (
  {
    account,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
  api: ChainAPI
): Promise<BigNumber> => {
  const txFee = (await api.getTxFeeCalculator()).lamportsPerSignature;

  switch (account.type) {
    case "Account": {
      const forTransfer = BigNumber.max(account.balance.minus(txFee), 0);
      if (!transaction) {
        return forTransfer;
      }
      switch (transaction.model.kind) {
        case "stake.createAccount": {
          const stakeAccRentExempt =
            await getStakeAccountMinimumBalanceForRentExemption(api);
          return BigNumber.max(
            account.balance.minus(txFee).minus(stakeAccRentExempt),
            0
          );
        }
        default:
          return forTransfer;
      }
    }
    case "TokenAccount":
      return account.balance;
  }

  throw new Error("not supported account type");
};

export default estimateMaxSpendableWithAPI;
