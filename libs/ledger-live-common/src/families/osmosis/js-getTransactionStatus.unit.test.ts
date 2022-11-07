import BigNumber from "bignumber.js";
import { ClaimRewardsFeesWarning } from "../../errors";
import { fromTransactionRaw } from "../cosmos/transaction";
import {
  CosmosAccount,
  CosmosLikeTransaction,
  CosmosResources,
  TransactionRaw,
} from "../cosmos/types";
import transactionStatus from "./js-getTransactionStatus";

const transaction: CosmosLikeTransaction = fromTransactionRaw({
  family: "osmosis",
  amount: "0",
  recipient: "",
  fees: "999999999999",
  validators: [
    {
      address: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
      amount: "0",
    },
  ],
} as TransactionRaw);

const account = {
  cosmosResources: {
    delegations: [
      {
        validatorAddress: "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt",
        amount: new BigNumber("2000000"),
        pendingRewards: new BigNumber("100"),
        status: "bonded",
      },
    ],
  } as CosmosResources,
} as CosmosAccount;

describe("Cosmos GetTransactionStatus", () => {
  it("should claim Reward with warning", async () => {
    const { warnings } = await transactionStatus(account, {
      ...transaction,
      mode: "claimReward",
    });

    expect(warnings.claimReward).toStrictEqual(new ClaimRewardsFeesWarning());
  });

  it("should claim Reward Compound with warning", async () => {
    const { warnings } = await transactionStatus(account, {
      ...transaction,
      mode: "claimRewardCompound",
    });

    expect(warnings.claimReward).toStrictEqual(new ClaimRewardsFeesWarning());
  });
});
