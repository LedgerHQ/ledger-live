import { runSwapWithoutAccountTest } from "./swap.other";

const transactionE2E = {
  account1: Account.BTC_NATIVE_SEGWIT_1,
  account2: Account.ETH_1,
  testTitle: "from Account present to Account not present",
  tmsLinks: ["B2CQA-3353"],
};

runSwapWithoutAccountTest(
  transactionE2E.account1,
  transactionE2E.account2,
  transactionE2E.testTitle,
  transactionE2E.tmsLinks,
  "noAccountFrom",
);
