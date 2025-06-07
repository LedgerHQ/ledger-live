import { runSwapWithoutAccountTest } from "./swap.other";

const transactionE2E = {
  account1: Account.ETH_1,
  account2: Account.BTC_NATIVE_SEGWIT_1,
  testTitle: "from Account not present to Account present",
  tmsLinks: ["B2CQA-3354"],
};

runSwapWithoutAccountTest(
  transactionE2E.account1,
  transactionE2E.account2,
  transactionE2E.testTitle,
  transactionE2E.tmsLinks,
  "noAccountTo",
);
