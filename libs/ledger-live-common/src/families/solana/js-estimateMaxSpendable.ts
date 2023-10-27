import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { ChainAPI } from "./api";
import {
  getAccountMinimumBalanceForRentExemption,
  getStakeAccountMinimumBalanceForRentExemption,
} from "./api/chain/web3";
import { getMainAccount } from "../../account";
import { estimateTxFee } from "./tx-fees";

const estimateMaxSpendableWithAPI = async (
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
  api: ChainAPI,
): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);

  switch (account.type) {
    case "Account": {
      const txKind = transaction?.model.kind ?? "transfer";
      const txFee = await estimateTxFee(api, mainAccount, txKind);

      const rentExemptMin = await getAccountMinimumBalanceForRentExemption(
        api,
        account.freshAddress,
      );

      switch (txKind) {
        case "stake.createAccount": {
          const stakeAccRentExempt = await getStakeAccountMinimumBalanceForRentExemption(api);

          return BigNumber.max(
            account.spendableBalance.minus(txFee).minus(rentExemptMin).minus(stakeAccRentExempt),
            0,
          );
        }
        default: {
          return BigNumber.max(account.spendableBalance.minus(txFee).minus(rentExemptMin), 0);
        }
      }
    }
    case "TokenAccount":
      return account.spendableBalance;
  }

  throw new Error("not supported account type");
};

export default estimateMaxSpendableWithAPI;
