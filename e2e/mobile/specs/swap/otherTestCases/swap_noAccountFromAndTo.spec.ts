import { runSwapWithoutAccountTest } from "./swap.other";

const transactionE2E = {
  account1: Account.ETH_1,
  account2: Account.BSC_1,
  testTitle: "from Account not present to Account not present",
  tmsLinks: ["B2CQA-3355"],
};

runSwapWithoutAccountTest(
  transactionE2E.account1,
  transactionE2E.account2,
  transactionE2E.testTitle,
  transactionE2E.tmsLinks,
  "noAccountFromAndTo",
);
